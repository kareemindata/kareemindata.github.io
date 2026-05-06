// DDI Risk Explorer — portfolio demo client
//
// Deployed-only variant. Always talks to the public HuggingFace Space for
// Layer 1 (DrugBank relation type) and renders an informational panel for
// Layer 2 (TwoSides) — Layer 2's frozen-encoder sweep did not promote a
// deployment-grade head, so there is no backend to call yet.
//
// For local development (talking to FastAPI on localhost:8000) use the
// in-repo version at github.com/kareemindata/ddi-risk-explorer/blob/main/assets/app.js.

(() => {
  const body = document.body;
  const hfSpace = body.dataset.hfSpace || "kareem-khaled/ddi-risk-explorer";
  const hfHost = `https://${hfSpace.replace("/", "-")}.hf.space`;

  const PRESETS = {
    "Aspirin × Ibuprofen": ["CC(=O)Oc1ccccc1C(=O)O", "CC(C)Cc1ccc(cc1)[C@@H](C)C(=O)O"],
    "Warfarin × Aspirin":  ["CC(=O)CC(c1ccccc1)c1c(O)c2ccccc2oc1=O", "CC(=O)Oc1ccccc1C(=O)O"],
    "Atorvastatin × Clarithromycin": [
      "CC(C)c1c(C(=O)Nc2ccccc2)c(-c2ccccc2)c(-c2ccc(F)cc2)n1CC[C@@H](O)C[C@@H](O)CC(=O)O",
      "CC[C@@H]1OC(=O)[C@H](C)[C@@H](O[C@H]2C[C@@](C)(OC)[C@@H](O)[C@H](C)O2)[C@H](C)[C@@H](O[C@@H]2O[C@H](C)C[C@@H]([C@H]2O)N(C)C)[C@](C)(OC)C[C@@H](C)C(=O)[C@H](C)[C@@H](O)[C@]1(C)O",
    ],
    "Metformin × Lisinopril": [
      "CN(C)C(=N)NC(=N)N",
      "N[C@@H](CCCCN)C(=O)N1CCC[C@H]1C(=O)O",
    ],
  };

  const tabs = Array.from(document.querySelectorAll(".tab"));
  const layer1Panel = document.querySelector("#layer1-panel");
  const layer2Panel = document.querySelector("#layer2-panel");
  const presetButtons = document.querySelectorAll(".preset button");

  function setLayer(n) {
    body.dataset.activeLayer = String(n);
    tabs.forEach((t) => t.setAttribute("aria-selected", t.dataset.layer === String(n) ? "true" : "false"));
    layer1Panel.style.display = n === 1 ? "" : "none";
    layer2Panel.style.display = n === 2 ? "" : "none";
  }

  tabs.forEach((t) => t.addEventListener("click", () => setLayer(parseInt(t.dataset.layer, 10))));

  presetButtons.forEach((b) => {
    b.addEventListener("click", () => {
      const [a, c] = PRESETS[b.dataset.preset] || [];
      if (!a || !c) return;
      const layer = parseInt(body.dataset.activeLayer, 10);
      const root = layer === 1 ? layer1Panel : layer2Panel;
      root.querySelector('input[name="smiles_a"]').value = a;
      root.querySelector('input[name="smiles_b"]').value = c;
      const map = {
        "Aspirin × Ibuprofen": ["Aspirin", "Ibuprofen"],
        "Warfarin × Aspirin":  ["Warfarin", "Aspirin"],
        "Atorvastatin × Clarithromycin": ["Atorvastatin", "Clarithromycin"],
        "Metformin × Lisinopril": ["Metformin", "Lisinopril"],
      };
      const [na, nb] = map[b.dataset.preset] || ["Drug A", "Drug B"];
      root.querySelector('input[name="name_a"]').value = na;
      root.querySelector('input[name="name_b"]').value = nb;
    });
  });

  // ---- Layer 1: HF Space Gradio API -----------------------------------
  layer1Panel.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const root = layer1Panel;
    const result = root.querySelector(".result");
    const button = root.querySelector("button.run");

    const smiles_a = root.querySelector('input[name="smiles_a"]').value.trim();
    const smiles_b = root.querySelector('input[name="smiles_b"]').value.trim();
    const name_a = root.querySelector('input[name="name_a"]').value.trim() || "Drug A";
    const name_b = root.querySelector('input[name="name_b"]').value.trim() || "Drug B";
    const top_k = Math.max(1, Math.min(10, parseInt(root.querySelector('input[name="top_k"]').value, 10) || 3));

    if (!smiles_a || !smiles_b) return renderError(result, "Both SMILES strings are required.");

    button.disabled = true;
    button.textContent = "Predicting…";
    try {
      const md = await callHFSpace({ smiles_a, smiles_b, name_a, name_b, top_k });
      renderLayer1(result, md, name_a, name_b, top_k);
    } catch (err) {
      renderError(result, err.message);
    } finally {
      button.disabled = false;
      button.textContent = "Predict interaction type";
    }
  });

  async function callHFSpace({ smiles_a, smiles_b, name_a, name_b, top_k }) {
    const callRes = await fetch(`${hfHost}/gradio_api/call/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [smiles_a, smiles_b, name_a, name_b, top_k] }),
    });
    if (!callRes.ok) throw new Error(`HF Space call failed: HTTP ${callRes.status}`);
    const { event_id } = await callRes.json();
    if (!event_id) throw new Error("HF Space did not return event_id");

    const streamRes = await fetch(`${hfHost}/gradio_api/call/predict/${event_id}`);
    if (!streamRes.ok) throw new Error(`HF Space stream failed: HTTP ${streamRes.status}`);
    const text = await streamRes.text();
    const m = text.match(/data:\s*(.*)\n/);
    if (!m) throw new Error("HF Space stream returned no data");
    const parsed = JSON.parse(m[1]);
    return Array.isArray(parsed) ? parsed[0] : parsed;
  }

  function renderLayer1(root, md, name_a, name_b, top_k) {
    if (typeof md !== "string") return renderError(root, "Unexpected response shape from HF Space.");
    const safe = escape(md)
      .replace(/^### (.*)$/gm, "<h3>$1</h3>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/_(.+?)_/g, "<em>$1</em>")
      .replace(/\n{2,}/g, "</p><p>")
      .replace(/\n/g, "<br>");
    root.innerHTML = `
      <div class="result-meta">
        <span><strong>${escape(name_a)}</strong> &times; <strong>${escape(name_b)}</strong></span>
        <span>top ${top_k} of 86 classes &middot; served by HF Space</span>
      </div>
      <div class="rendered-md"><p>${safe}</p></div>
    `;
    root.classList.add("show");
  }

  // ---- Layer 2: informational only (no backend deployed yet) ----------
  layer2Panel.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const result = layer2Panel.querySelector(".result");
    result.innerHTML = `
      <div class="error" style="background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.32); color: #fde68a;">
        <strong>Layer 2 is not deployed yet.</strong><br>
        The TwoSides multi-label sweep ran at four frequency thresholds (200 / 500 / 1000 / 2000)
        but no threshold cleared the deployment quality gate (&ge;95% AUROC on &ge;70% of labels).
        Macro-AUROC across thresholds: 0.74&ndash;0.79 &mdash; competitive with Decagon-tier literature
        but below this stretch target. Per-threshold heads are shipped at
        <a href="https://huggingface.co/kareem-khaled/ddi-risk-explorer-gnn/tree/main" target="_blank" rel="noopener" style="color: #fde68a; text-decoration: underline;">huggingface.co/kareem-khaled/ddi-risk-explorer-gnn</a>
        for downstream research. See the
        <a href="https://github.com/kareemindata/ddi-risk-explorer#layer-2-results--twosides-multi-label" target="_blank" rel="noopener" style="color: #fde68a; text-decoration: underline;">Layer 2 results section</a>
        of the repo for the full sweep verdict and the path to closing the gap.
      </div>
    `;
    result.classList.add("show");
  });

  function renderError(root, msg) {
    root.innerHTML = `<div class="error">${escape(msg)}</div>`;
    root.classList.add("show");
  }

  function escape(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch])
    );
  }

  setLayer(1);
})();
