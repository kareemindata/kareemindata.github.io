// DDI Risk Explorer — story-mode demo client (v2)
//
// One submit -> both layers fire in parallel via the deployed HF Space's
// /gradio_api/call/predict_story endpoint, then the result unfolds as
// three chapters:
//   1. Meet the molecules (PubChem-rendered structures + atom/bond stats)
//   2. Layer 1 - DrugBank relation type (top-K with severity badge)
//   3. Layer 2 - TwoSides co-occurring conditions (with real SE names)
//
// Molecule images come from PubChem REST (no client-side parser needed).
// Side-effect names come from assets/se_labels.json (1317 entries, lifted
// from the underlying TwoSides CSV).

(() => {
  const body = document.body;
  const apiBase = body.dataset.apiBase || "";
  const hfSpace = body.dataset.hfSpace || "kareem-khaled/ddi-risk-explorer";
  const hfHost = `https://${hfSpace.replace("/", "-")}.hf.space`;
  const useLocalApi = !!apiBase;

  // PubChem REST PNG endpoint — drop a SMILES in, get back a clean structure image.
  function pubchemImage(smiles, size = "large") {
    return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/PNG?image_size=${size}`;
  }

  const PRESETS = {
    "Aspirin × Ibuprofen": {
      a: "CC(=O)Oc1ccccc1C(=O)O",
      b: "CC(C)Cc1ccc(cc1)[C@@H](C)C(=O)O",
      na: "Aspirin", nb: "Ibuprofen",
      hint: "NSAID + NSAID — antiplatelet blunting + GI bleeding risk",
    },
    "Warfarin × Aspirin": {
      a: "CC(=O)CC(c1ccccc1)c1c(O)c2ccccc2oc1=O",
      b: "CC(=O)Oc1ccccc1C(=O)O",
      na: "Warfarin", nb: "Aspirin",
      hint: "Anticoagulant + antiplatelet — major bleeding risk",
    },
    "Atorvastatin × Clarithromycin": {
      a: "CC(C)c1c(C(=O)Nc2ccccc2)c(-c2ccccc2)c(-c2ccc(F)cc2)n1CC[C@@H](O)C[C@@H](O)CC(=O)O",
      b: "CC[C@@H]1OC(=O)[C@H](C)[C@@H](O[C@H]2C[C@@](C)(OC)[C@@H](O)[C@H](C)O2)[C@H](C)[C@@H](O[C@@H]2O[C@H](C)C[C@@H]([C@H]2O)N(C)C)[C@](C)(OC)C[C@@H](C)C(=O)[C@H](C)[C@@H](O)[C@]1(C)O",
      na: "Atorvastatin", nb: "Clarithromycin",
      hint: "Statin + macrolide — classic CYP3A4 inhibition",
    },
    "Metformin × Lisinopril": {
      a: "CN(C)C(=N)NC(=N)N",
      b: "N[C@@H](CCCCN)C(=O)N1CCC[C@H]1C(=O)O",
      na: "Metformin", nb: "Lisinopril",
      hint: "Antidiabetic + ACE inhibitor — additive hypoglycemic effect",
    },
    "Simvastatin × Amiodarone": {
      a: "CCC(C)(C)C(=O)O[C@H]1C[C@@H](C)C=C2C=C[C@H](C)[C@H](CC[C@@H]3C[C@@H](O)CC(=O)O3)[C@@H]12",
      b: "CCCCc1oc2ccccc2c1C(=O)c1cc(I)c(OCCN(CC)CC)c(I)c1",
      na: "Simvastatin", nb: "Amiodarone",
      hint: "Statin + antiarrhythmic — myopathy / rhabdomyolysis risk",
    },
    "Sertraline × Tramadol": {
      a: "CN[C@H]1CC[C@@H](c2ccc(Cl)c(Cl)c2)c2ccccc21",
      b: "COc1cccc([C@]2(O)CCCC[C@@H]2CN(C)C)c1",
      na: "Sertraline", nb: "Tramadol",
      hint: "SSRI + opioid — serotonin syndrome risk",
    },
    "Caffeine × Acetaminophen": {
      a: "Cn1c(=O)c2c(ncn2C)n(C)c1=O",
      b: "CC(=O)Nc1ccc(O)cc1",
      na: "Caffeine", nb: "Acetaminophen",
      hint: "Common OTC pair — generally safe; tests low-confidence regime",
    },
    "Phenytoin × Clarithromycin": {
      a: "O=C1NC(=O)C(c2ccccc2)(c2ccccc2)N1",
      b: "CC[C@@H]1OC(=O)[C@H](C)[C@@H](O[C@H]2C[C@@](C)(OC)[C@@H](O)[C@H](C)O2)[C@H](C)[C@@H](O[C@@H]2O[C@H](C)C[C@@H]([C@H]2O)N(C)C)[C@](C)(OC)C[C@@H](C)C(=O)[C@H](C)[C@@H](O)[C@]1(C)O",
      na: "Phenytoin", nb: "Clarithromycin",
      hint: "Anticonvulsant + macrolide — phenytoin toxicity via CYP3A4",
    },
  };

  // ===== DOM =============================================================
  const form = document.querySelector("#story-form");
  const story = document.querySelector("#story");
  const presetButtons = document.querySelectorAll(".preset button");
  const submitBtn = form.querySelector("button.run");

  // SE id -> condition name (loaded once on page init)
  let SE_NAMES = {};
  fetch("assets/se_labels.json")
    .then((r) => (r.ok ? r.json() : {}))
    .then((m) => { SE_NAMES = m || {}; })
    .catch(() => { SE_NAMES = {}; });

  function seName(id) {
    const k = String(id);
    if (k in SE_NAMES) return SE_NAMES[k];
    return `polypharmacy side effect SE #${k}`;
  }

  // ===== Presets =========================================================
  presetButtons.forEach((b) => {
    b.addEventListener("click", () => {
      const p = PRESETS[b.dataset.preset];
      if (!p) return;
      form.elements.smiles_a.value = p.a;
      form.elements.smiles_b.value = p.b;
      form.elements.name_a.value = p.na;
      form.elements.name_b.value = p.nb;
    });
  });

  // ===== Submit ==========================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const smiles_a = form.elements.smiles_a.value.trim();
    const smiles_b = form.elements.smiles_b.value.trim();
    const name_a = form.elements.name_a.value.trim() || "Drug A";
    const name_b = form.elements.name_b.value.trim() || "Drug B";
    const top_k_l1 = parseInt(form.elements.top_k_l1.value, 10) || 3;
    const top_k_l2 = parseInt(form.elements.top_k_l2.value, 10) || 8;

    if (!smiles_a || !smiles_b) {
      renderStoryError("Both SMILES strings are required.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Running both layers…";
    story.innerHTML = `<div class="chapter"><span class="loading">Calling the GINE encoder + bilinear co-attention head, then the frozen-encoder side-effect head…</span></div>`;
    story.classList.add("show");

    try {
      const payload = await callStory({ smiles_a, smiles_b, name_a, name_b, top_k_l1, top_k_l2 });
      renderStory(payload, { name_a, name_b, smiles_a, smiles_b });
      story.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      if (err.name === "SpaceSleepingError") {
        renderSpaceSleeping();
      } else {
        renderStoryError(err.message);
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Tell me the story";
    }
  });

  // ===== Backend dispatch ================================================
  async function callStory(input) {
    if (useLocalApi) {
      try { return await callLocalApi(input); }
      catch (e) { console.warn("Local API failed, falling back to HF Space:", e); return await callHFSpace(input); }
    }
    return await callHFSpace(input);
  }

  async function callLocalApi(input) {
    const [r1, r2] = await Promise.all([
      fetch(`${apiBase}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smiles_a: input.smiles_a, smiles_b: input.smiles_b,
          drug_name_a: input.name_a, drug_name_b: input.name_b,
          top_k: input.top_k_l1,
        }),
      }),
      fetch(`${apiBase}/predict_side_effects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smiles_a: input.smiles_a, smiles_b: input.smiles_b,
          drug_name_a: input.name_a, drug_name_b: input.name_b,
          top_k: input.top_k_l2,
          decision_threshold: 0.5,
        }),
      }),
    ]);
    if (!r1.ok || !r2.ok) throw new Error(`local API returned HTTP ${r1.status}/${r2.status}`);
    return { layer1: await safeJson(r1, "Layer 1"), layer2: await safeJson(r2, "Layer 2") };
  }

  async function callHFSpace(input) {
    const callRes = await fetch(`${hfHost}/gradio_api/call/predict_story`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          input.smiles_a, input.smiles_b, input.name_a, input.name_b,
          input.top_k_l1, input.top_k_l2, 0.5,
        ],
      }),
    });
    if (!callRes.ok) throw new SpaceSleepingError(`HF Space POST returned HTTP ${callRes.status}`);
    const ct = (callRes.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("json")) throw new SpaceSleepingError("Space returned HTML instead of JSON (likely sleeping)");
    const initial = await callRes.json();
    if (!initial.event_id) throw new Error("HF Space did not return event_id");

    const streamRes = await fetch(`${hfHost}/gradio_api/call/predict_story/${initial.event_id}`);
    if (!streamRes.ok) throw new SpaceSleepingError(`HF Space stream HTTP ${streamRes.status}`);
    const text = await streamRes.text();
    if (text.trim().startsWith("<")) throw new SpaceSleepingError("Space stream returned HTML instead of SSE");
    const m = text.match(/data:\s*(\[[\s\S]*?\])\n/);
    if (!m) throw new Error("HF Space stream returned no data block");
    const parsed = JSON.parse(m[1]);
    return Array.isArray(parsed) ? parsed[0] : parsed;
  }

  async function safeJson(response, label) {
    const ct = (response.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("json")) {
      throw new Error(`${label} returned non-JSON (HTTP ${response.status}). The local FastAPI may not be running on ${apiBase}.`);
    }
    return await response.json();
  }

  class SpaceSleepingError extends Error {
    constructor(msg) { super(msg); this.name = "SpaceSleepingError"; }
  }

  // ===== Rendering =======================================================
  function renderStory(data, ctx) {
    const l1 = data.layer1 || {};
    const l2 = data.layer2 || {};
    if (l1.error) return renderStoryError(`Layer 1: ${l1.error}`);

    story.innerHTML = `
      ${chapterMolecules(l1, ctx)}
      ${chapterRelationType(l1)}
      ${chapterSideEffects(l2)}
    `;

    requestAnimationFrame(() => {
      story.querySelectorAll(".prob-fill[data-target]").forEach((el) => {
        el.style.width = el.dataset.target + "%";
      });
    });

    story.querySelectorAll(".mol-smiles").forEach((el) => {
      el.addEventListener("click", () => {
        navigator.clipboard.writeText(el.dataset.smiles).then(() => {
          el.classList.add("copied");
          const original = el.textContent;
          el.textContent = "✓ copied · " + original;
          setTimeout(() => {
            el.classList.remove("copied");
            el.textContent = original;
          }, 1500);
        });
      });
    });
  }

  function chapterMolecules(l1, ctx) {
    const a_smiles = l1.drug_a_smiles || ctx.smiles_a || "";
    const b_smiles = l1.drug_b_smiles || ctx.smiles_b || "";
    const a_name = l1.drug_a || ctx.name_a;
    const b_name = l1.drug_b || ctx.name_b;
    const a_atoms = l1.drug_a_atom_count != null ? l1.drug_a_atom_count : "?";
    const a_bonds = l1.drug_a_bond_count != null ? l1.drug_a_bond_count : "?";
    const b_atoms = l1.drug_b_atom_count != null ? l1.drug_b_atom_count : "?";
    const b_bonds = l1.drug_b_bond_count != null ? l1.drug_b_bond_count : "?";
    const a_pubchem_link = `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(a_smiles)}`;
    const b_pubchem_link = `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(b_smiles)}`;

    return `
      <article class="chapter" data-layer="0">
        <div class="chapter-num">Chapter 1 · Meet the molecules</div>
        <h3>Two drugs, two graphs</h3>
        <p class="lede">Each drug becomes a graph the model can see: <span data-tip="One node per atom, encoded as a 77-dimensional feature vector covering atom type, degree, hydrogens, charge, hybridization, chirality, aromaticity, and ring membership.">atoms are nodes</span>, <span data-tip="One edge per bond, encoded with a 14-dimensional vector for bond type, conjugation, ring membership, and stereochemistry.">bonds are edges</span>. The structure images below come from <a href="https://pubchem.ncbi.nlm.nih.gov" target="_blank" rel="noopener" style="color: var(--ink);">PubChem</a>; the atom and bond counts come straight from RDKit's parse of the SMILES the model just received.</p>
        <div class="molecules">
          <div class="molecule-card">
            <div class="mol-name">
              <h4>${escape(a_name)}</h4>
              <span class="mol-side">Drug A</span>
            </div>
            <div class="mol-svg">
              <a href="${a_pubchem_link}" target="_blank" rel="noopener" title="View on PubChem">
                <img src="${pubchemImage(a_smiles)}" alt="${escape(a_name)} structure" loading="lazy" onerror="this.parentElement.innerHTML='<span class=\\'mol-fallback\\'>structure unavailable</span>';" />
              </a>
            </div>
            <div class="mol-stats"><span><strong>${a_atoms}</strong> atoms</span><span><strong>${a_bonds}</strong> bonds</span></div>
            <div class="mol-smiles" data-smiles="${escape(a_smiles)}" title="Click to copy SMILES">${escape(a_smiles)}</div>
          </div>
          <div class="molecule-card">
            <div class="mol-name">
              <h4>${escape(b_name)}</h4>
              <span class="mol-side">Drug B</span>
            </div>
            <div class="mol-svg">
              <a href="${b_pubchem_link}" target="_blank" rel="noopener" title="View on PubChem">
                <img src="${pubchemImage(b_smiles)}" alt="${escape(b_name)} structure" loading="lazy" onerror="this.parentElement.innerHTML='<span class=\\'mol-fallback\\'>structure unavailable</span>';" />
              </a>
            </div>
            <div class="mol-stats"><span><strong>${b_atoms}</strong> atoms</span><span><strong>${b_bonds}</strong> bonds</span></div>
            <div class="mol-smiles" data-smiles="${escape(b_smiles)}" title="Click to copy SMILES">${escape(b_smiles)}</div>
          </div>
        </div>
      </article>
    `;
  }

  function chapterRelationType(l1) {
    if (!l1 || !l1.top_predictions) return "";
    const top = l1.top_predictions[0] || {};
    const sev = severityFor(top.probability || 0);
    return `
      <article class="chapter" data-layer="1">
        <div class="chapter-num">Chapter 2 · Layer 1 · DrugBank</div>
        <h3>What kind of interaction is at risk?
          <span class="severity ${sev.cls}" title="${sev.tip}">${sev.label}</span>
        </h3>
        <p class="lede">Top-${l1.top_predictions.length} of <strong>86 DrugBank relation types</strong>. Each label is a templated sentence describing a clinically-curated kind of interaction (e.g. "the metabolism of #Drug2 can be decreased when combined with #Drug1"). Layer 1 picks the most likely class as a single-best answer.</p>
        <ol class="predictions">
          ${l1.top_predictions.map(p => `
            <li>
              <span class="rank">${p.rank}</span>
              <div class="pred-text">
                <span class="label-text">${escape(p.interaction_text)}</span>
                <div class="prob-track"><div class="prob-fill" data-target="${(p.probability * 100).toFixed(1)}"></div></div>
              </div>
              <span class="prob-text">${(p.probability * 100).toFixed(1)}%</span>
            </li>`).join("")}
        </ol>
        ${l1.disclaimer ? `<p class="disclaimer">${escape(l1.disclaimer)}</p>` : ""}
      </article>
    `;
  }

  function chapterSideEffects(l2) {
    if (!l2) return "";
    if (l2.error) {
      return `
        <article class="chapter" data-layer="2">
          <div class="chapter-num">Chapter 3 · Layer 2 · TwoSides</div>
          <h3>Which adverse events co-occur in patient records?</h3>
          <div class="error">${escape(l2.error)}</div>
        </article>
      `;
    }
    const ranks = (l2.top_predictions || []).map(p => {
      const name = seName(p.side_effect_id);
      return `
        <li>
          <span class="rank">${p.rank}</span>
          <div class="pred-text">
            <span class="label-text">${escape(name)}${p.above_threshold ? '<span class="above-dot" title="above the decision threshold"></span>' : ""}</span>
            <div class="prob-track"><div class="prob-fill" data-target="${(p.probability * 100).toFixed(1)}"></div></div>
          </div>
          <span class="prob-text">${(p.probability * 100).toFixed(1)}%</span>
        </li>
      `;
    }).join("");

    const macroLine = l2.macro_auroc_test != null
      ? `Test macro-AUROC <strong>${l2.macro_auroc_test.toFixed(3)}</strong>.`
      : "";
    const aboveLine = l2.n_above_threshold != null
      ? `<strong>${l2.n_above_threshold}</strong> of ${l2.label_vocab_size || 1134} conditions above the ${(l2.decision_threshold ?? 0.5).toFixed(2)} threshold.`
      : "";

    return `
      <article class="chapter" data-layer="2">
        <div class="chapter-num">Chapter 3 · Layer 2 · TwoSides</div>
        <h3>Which adverse events co-occur in patient records?</h3>
        <p class="lede">
          Top-${(l2.top_predictions || []).length} of <strong>${l2.label_vocab_size || 1134}</strong> polypharmacy side effects from the
          <a href="https://www.science.org/doi/10.1126/scitranslmed.3003377" target="_blank" rel="noopener" style="color: var(--ink);">TwoSides</a> dataset. ${macroLine} ${aboveLine}
        </p>
        <p class="lede" style="background: rgba(124,92,255,0.06); border-left: 3px solid var(--layer2); padding: 10px 14px; border-radius: 0 8px 8px 0;">
          <strong>How to read this:</strong> these are the medical conditions most commonly <em>also flagged</em> in records of patients on this drug pair, ranked by the model's confidence. The ranking reflects training-data bias — patients on multiple medications are typically older with chronic comorbidities, so common conditions (cardiovascular, metabolic, oncologic) bubble up.
        </p>
        <ol class="predictions">${ranks}</ol>
        ${l2.disclaimer ? `<p class="disclaimer">${escape(l2.disclaimer)}</p>` : ""}
      </article>
    `;
  }

  function renderStoryError(msg) {
    story.innerHTML = `<div class="chapter"><div class="error">${escape(msg)}</div></div>`;
    story.classList.add("show");
  }

  function renderSpaceSleeping() {
    const spaceUrl = `https://huggingface.co/spaces/${hfSpace}`;
    story.innerHTML = `
      <article class="chapter" data-layer="0">
        <div class="chapter-num">Quick fix</div>
        <h3>The HuggingFace Space is sleeping 💤</h3>
        <p class="lede">Free CPU Spaces auto-pause after a stretch of no traffic. The model is fine — the container just needs to be woken up. This usually takes 60-90 seconds.</p>
        <p style="margin: 0 0 14px 0;">
          <a class="pill" href="${spaceUrl}" target="_blank" rel="noopener" style="background: linear-gradient(135deg, var(--layer1), var(--layer2)); color: white; border: none; padding: 10px 18px; font-weight: 700;">
            ▶ Open the Space &amp; tap Restart
          </a>
        </p>
        <p style="margin: 0; font-size: 13px; color: var(--ink-dim);">
          Once the Space header shows <strong>"Running"</strong>, come back here and click <em>Tell me the story</em> again.
        </p>
      </article>
    `;
    story.classList.add("show");
  }

  // ===== Helpers =========================================================
  function severityFor(p) {
    if (p >= 0.6) return { cls: "high", label: "high confidence", tip: "Top-1 probability ≥ 60%" };
    if (p >= 0.3) return { cls: "medium", label: "moderate confidence", tip: "Top-1 probability 30–60%" };
    return { cls: "low", label: "low confidence", tip: "Top-1 probability below 30% — the model spreads its mass" };
  }

  function escape(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch])
    );
  }
})();
