// DDI Risk Explorer — story-mode demo client
//
// One submit -> both layers fire in parallel against the deployed HF Space's
// `/gradio_api/call/predict_story` endpoint. The result unfolds as four
// chapters: meet the molecules, what kind of interaction, which side
// effects, how the model arrived at it.
//
// Molecule rendering uses smiles-drawer (loaded from CDN in Demo.html) so
// no build step is required.

(() => {
  const body = document.body;
  const apiBase = body.dataset.apiBase || "";
  const hfSpace = body.dataset.hfSpace || "kareem-khaled/ddi-risk-explorer";
  const hfHost = `https://${hfSpace.replace("/", "-")}.hf.space`;
  const useLocalApi = !!apiBase;

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
    const top_k_l2 = parseInt(form.elements.top_k_l2.value, 10) || 10;

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
      renderStory(payload, { name_a, name_b });
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
      // Local FastAPI first; gracefully fall back to HF Space if unreachable
      try {
        return await callLocalApi(input);
      } catch (localErr) {
        console.warn("Local API failed, falling back to HF Space:", localErr);
        return await callHFSpace(input);
      }
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
    if (!r1.ok || !r2.ok) {
      throw new Error(`local API returned HTTP ${r1.status}/${r2.status}`);
    }
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
    if (!callRes.ok) {
      throw new SpaceSleepingError(`HF Space POST returned HTTP ${callRes.status}`);
    }
    const ct = (callRes.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("json")) {
      // The Space returned an HTML error page — almost always means it is paused/sleeping.
      throw new SpaceSleepingError("Space returned HTML instead of JSON (likely sleeping)");
    }
    const initial = await callRes.json();
    if (!initial.event_id) throw new Error("HF Space did not return event_id");

    const streamRes = await fetch(`${hfHost}/gradio_api/call/predict_story/${initial.event_id}`);
    if (!streamRes.ok) throw new SpaceSleepingError(`HF Space stream returned HTTP ${streamRes.status}`);
    const text = await streamRes.text();

    // Successful Gradio responses begin with the SSE prefix `event: complete`
    if (text.trim().startsWith("<")) {
      throw new SpaceSleepingError("Space stream returned HTML instead of an SSE stream");
    }

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
      ${chapterHowItWorks()}
    `;

    // Trigger probability bar animations after the DOM is in place
    requestAnimationFrame(() => {
      story.querySelectorAll(".prob-fill[data-target]").forEach((el) => {
        el.style.width = el.dataset.target + "%";
      });
    });

    // Wire up SMILES copy-to-clipboard
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

    // Render molecules with smiles-drawer
    drawMolecule("mol-svg-a", l1.drug_a_smiles);
    drawMolecule("mol-svg-b", l1.drug_b_smiles);
  }

  function chapterMolecules(l1, ctx) {
    const a_smiles = l1.drug_a_smiles || "";
    const b_smiles = l1.drug_b_smiles || "";
    const a_name = l1.drug_a || ctx.name_a;
    const b_name = l1.drug_b || ctx.name_b;
    const a_atoms = l1.drug_a_atom_count != null ? l1.drug_a_atom_count : "?";
    const a_bonds = l1.drug_a_bond_count != null ? l1.drug_a_bond_count : "?";
    const b_atoms = l1.drug_b_atom_count != null ? l1.drug_b_atom_count : "?";
    const b_bonds = l1.drug_b_bond_count != null ? l1.drug_b_bond_count : "?";

    return `
      <article class="chapter" data-layer="0">
        <div class="chapter-num">Chapter 1 · Meet the molecules</div>
        <h3>Two drugs, two graphs</h3>
        <p class="lede">Each drug becomes a graph: <span data-tip="One node per atom, encoded with a 77-dimensional feature vector covering atom type, degree, hydrogens, charge, hybridization, chirality, aromaticity, and ring membership.">atoms are nodes</span>, <span data-tip="One edge per bond, encoded with a 14-dimensional vector for bond type, conjugation, ring membership, and stereochemistry.">bonds are edges</span>. The same shared encoder will see both molecules.</p>
        <div class="molecules">
          <div class="molecule-card">
            <div class="mol-name"><h4>${escape(a_name)}</h4><span class="mol-side">Drug A</span></div>
            <div id="mol-svg-a" class="mol-svg"><span class="loading">drawing…</span></div>
            <div class="mol-stats"><span><strong>${a_atoms}</strong> atoms</span><span><strong>${a_bonds}</strong> bonds</span></div>
            <div class="mol-smiles" data-smiles="${escape(a_smiles)}" title="Click to copy SMILES">${escape(a_smiles)}</div>
          </div>
          <div class="molecule-card">
            <div class="mol-name"><h4>${escape(b_name)}</h4><span class="mol-side">Drug B</span></div>
            <div id="mol-svg-b" class="mol-svg"><span class="loading">drawing…</span></div>
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
        <p class="lede">Top-${l1.top_predictions.length} of <strong>86 DrugBank relation types</strong>. Higher bar = the model thinks this kind of interaction is more likely between this pair. <span data-tip="Class 49 — 'risk or severity of adverse effects can be increased' — is the most common DrugBank relation type and the majority-class baseline (31.7%).">Why these labels?</span></p>
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
          <h3>Which side effects might co-occur?</h3>
          <div class="error">${escape(l2.error)}</div>
        </article>
      `;
    }
    const ranks = (l2.top_predictions || []).map(p => `
      <li>
        <span class="rank">${p.rank}</span>
        <div class="pred-text">
          <span class="label-text">Polypharmacy side effect <code style="font-family:ui-monospace,monospace;background:rgba(0,0,0,0.3);padding:1px 6px;border-radius:4px;">SE #${escape(p.side_effect_id)}</code>${p.above_threshold ? '<span class="above-dot" title="above the decision threshold"></span>' : ""}</span>
          <div class="prob-track"><div class="prob-fill" data-target="${(p.probability * 100).toFixed(1)}"></div></div>
        </div>
        <span class="prob-text">${(p.probability * 100).toFixed(1)}%</span>
      </li>
    `).join("");

    return `
      <article class="chapter" data-layer="2">
        <div class="chapter-num">Chapter 3 · Layer 2 · TwoSides</div>
        <h3>Which side effects might co-occur?</h3>
        <p class="lede">
          Top-${(l2.top_predictions || []).length} of <strong>${l2.label_vocab_size || 1134} polypharmacy side effects</strong>
          (filtered to SEs occurring in ≥${l2.training_threshold || 200} drug pairs).
          ${l2.macro_auroc_test != null ? `Test macro-AUROC <strong>${l2.macro_auroc_test.toFixed(3)}</strong>.` : ""}
          ${l2.n_above_threshold != null ? ` <strong>${l2.n_above_threshold}</strong> SEs above the ${(l2.decision_threshold ?? 0.5).toFixed(2)} decision threshold.` : ""}
        </p>
        <ol class="predictions">${ranks}</ol>
        ${l2.disclaimer ? `<p class="disclaimer">${escape(l2.disclaimer)}</p>` : ""}
      </article>
    `;
  }

  function chapterHowItWorks() {
    return `
      <article class="chapter" data-layer="0">
        <div class="chapter-num">Chapter 4 · Behind the scenes</div>
        <h3>How did the model arrive at this story?</h3>
        <p class="lede">A single shared molecular encoder feeds both layers. <strong>Layer 1 is trained first; the encoder weights are then frozen for Layer 2.</strong> That keeps the 96.39% DrugBank top-1 untouched and makes Layer 2 cheap to retrain.</p>
        <div class="how-grid">
          <div class="how-step">
            <h4><span class="step-num">1</span> Featurize</h4>
            <p>Each drug → PyG molecular graph. Atom features <code>77-d</code>, bond features <code>14-d</code>.</p>
          </div>
          <div class="how-step">
            <h4><span class="step-num">2</span> Encode</h4>
            <p><strong>4 GINEConv layers</strong> shared between Drug A and B. Per-atom embeddings pooled mean+max+sum → 128-d drug vector.</p>
          </div>
          <div class="how-step">
            <h4><span class="step-num">3</span> Predict</h4>
            <p><strong>L1</strong>: bilinear co-attention between A and B's atoms → 86-class softmax. <strong>L2</strong>: <code>[a; b; |a−b|; a*b]</code> → multi-label sigmoid over 1 134 SEs.</p>
          </div>
        </div>
        <p style="margin: 0; font-size: 13px; color: var(--ink-dim);">
          Read the <a href="https://github.com/kareemindata/ddi-risk-explorer" target="_blank" rel="noopener" style="color: var(--ink);">code</a>,
          the <a href="https://ieeexplore.ieee.org/abstract/document/11428029" target="_blank" rel="noopener" style="color: var(--ink);">IEEE paper</a>,
          or the <a href="https://huggingface.co/kareem-khaled/ddi-risk-explorer-gnn" target="_blank" rel="noopener" style="color: var(--ink);">trained weights</a>.
        </p>
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
          If you keep seeing this, the latest commit may still be building — check the
          <a href="${spaceUrl}" target="_blank" rel="noopener" style="color: var(--ink);">Build logs</a> tab.
        </p>
      </article>
    `;
    story.classList.add("show");
  }

  // ===== Helpers =========================================================
  function severityFor(p) {
    if (p >= 0.6) return { cls: "high", label: "high confidence", tip: "Top-1 probability is ≥ 60%" };
    if (p >= 0.3) return { cls: "medium", label: "moderate confidence", tip: "Top-1 probability is between 30% and 60%" };
    return { cls: "low", label: "low confidence", tip: "Top-1 probability is below 30% — many candidate types share the mass" };
  }

  function escape(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch])
    );
  }

  // SmilesDrawer is a global pulled in by Demo.html via CDN; render on demand.
  function drawMolecule(elementId, smiles) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (!smiles) { el.innerHTML = '<span class="error">no SMILES</span>'; return; }
    if (typeof SmilesDrawer === "undefined") {
      // Fallback: just show SMILES string if the library failed to load
      el.innerHTML = `<span style="color:#0f172a;font-family:ui-monospace,monospace;font-size:11px;padding:8px;">${escape(smiles)}</span>`;
      return;
    }
    try {
      const drawer = new SmilesDrawer.SvgDrawer({ width: 320, height: 200, padding: 8 });
      SmilesDrawer.parse(smiles, (tree) => {
        el.innerHTML = "";
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "200");
        svg.setAttribute("viewBox", "0 0 320 200");
        el.appendChild(svg);
        drawer.draw(tree, svg, "light");
      }, () => {
        el.innerHTML = `<span style="color:#0f172a;font-family:ui-monospace,monospace;font-size:11px;padding:8px;">${escape(smiles)}</span>`;
      });
    } catch (e) {
      el.innerHTML = `<span style="color:#0f172a;font-family:ui-monospace,monospace;font-size:11px;padding:8px;">${escape(smiles)}</span>`;
    }
  }
})();
