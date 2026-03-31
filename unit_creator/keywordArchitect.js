class KeywordArchitect {
  constructor() {
    this.modal = null;
  }

  open() {
    document.getElementById("keywordModal").style.display = "flex";
  }

  close() {
    document.getElementById("keywordModal").style.display = "none";
  }

  /**
   * Logic from Python: get_current_logic()
   */
  getCurrentLogic() {
    const name = document.getElementById("kwName").value.trim();
    const type = document.getElementById("kwType").value;
    const valRaw = document.getElementById("kwValue").value.trim();

    const logicObj = {
      bal_type: type,
      target_pillar: document.getElementById("kwPillar").value,
      is_flat: document.getElementById("kwIsFlat").checked,
      effect: document.getElementById("kwEffect").value,
      trigger: document.getElementById("kwTrigger").value,
    };

    if (type === "formula") {
      logicObj.bal_formula = valRaw;
    } else {
      const numVal = parseFloat(valRaw);
      if (isNaN(numVal)) {
        alert("Multipliers and Flats require a numeric value.");
        return null;
      }
      logicObj.bal_val = numVal;
    }

    return {
      name: name,
      data: {
        desc: document.getElementById("kwDesc").value,
        logic: logicObj,
      },
    };
  }

  updatePreview() {
    const result = this.getCurrentLogic();
    if (!result) return;

    const preview = {};
    preview[result.name] = result.data;
    document.getElementById("kwPreview").innerText = JSON.stringify(preview, null, 4);
  }

  copyToClipboard() {
    this.updatePreview();
    const content = document.getElementById("kwPreview").innerText;
    if (content) {
      navigator.clipboard.writeText(content);
      alert("Keyword JSON copied to clipboard!");
    }
  }
}

const architect = new KeywordArchitect();
