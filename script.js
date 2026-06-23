const form = document.getElementById("calculator-form");
const calculateButton = document.getElementById("calculate-button");
const resetButton = document.getElementById("reset-button");
const errorMessage = document.getElementById("error-message");
const egfrValue = document.getElementById("egfr-value");
const ccrValue = document.getElementById("ccr-value");
const bsaValue = document.getElementById("bsa-value");
const egfrStage = document.getElementById("egfr-stage");
const ccrNote = document.getElementById("ccr-note");
const bsaNote = document.getElementById("bsa-note");
const offlineStatus = document.getElementById("offline-status");

const DEFAULT_EGFR_NOTE = "年齢・性別・血清クレアチニンを入力すると計算されます。";
const DEFAULT_CCR_NOTE = "体重を入力すると計算されます。";
const DEFAULT_BSA_NOTE = "身長と体重を入力すると計算されます。";

function calculateEgfr(age, sex, creatinine) {
  const base = 194 * Math.pow(creatinine, -1.094) * Math.pow(age, -0.287);
  return sex === "female" ? base * 0.739 : base;
}

function calculateCcr(age, sex, creatinine, weight) {
  const base = ((140 - age) * weight) / (72 * creatinine);
  return sex === "female" ? base * 0.85 : base;
}

function calculateBsa(height, weight) {
  return 0.008883 * Math.pow(height, 0.663) * Math.pow(weight, 0.444);
}

function getEgfrStage(egfr) {
  if (egfr >= 90) return "G1: 正常または高値";
  if (egfr >= 60) return "G2: 正常または軽度低下";
  if (egfr >= 45) return "G3a: 軽度から中等度低下";
  if (egfr >= 30) return "G3b: 中等度から高度低下";
  if (egfr >= 15) return "G4: 高度低下";
  return "G5: 腎不全";
}

function formatNumber(value) {
  return Number.isFinite(value) ? value.toFixed(1) : "-";
}

function validateAge(age) {
  if (!age) {
    return {
      kind: "missing",
      message: "eGFRとCCRの計算には年齢を入力してください。"
    };
  }

  if (age < 18) {
    return {
      kind: "invalid",
      message: "eGFRとCCRの計算は18歳以上を想定しています。"
    };
  }

  if (age > 120) {
    return {
      kind: "invalid",
      message: "年齢が大きすぎるようです。入力値を確認してください。"
    };
  }

  return {
    kind: "valid",
    message: ""
  };
}

function validateCreatinine(creatinine) {
  if (!creatinine) {
    return {
      kind: "missing",
      message: "eGFRとCCRの計算には血清クレアチニンを入力してください。"
    };
  }

  if (creatinine <= 0) {
    return {
      kind: "invalid",
      message: "血清クレアチニンは0より大きい値を入力してください。"
    };
  }

  return {
    kind: "valid",
    message: ""
  };
}

function validateWeight(weight) {
  if (!weight) {
    return {
      kind: "missing",
      message: DEFAULT_CCR_NOTE
    };
  }

  if (weight <= 0) {
    return {
      kind: "invalid",
      message: "体重は0より大きい値を入力してください。"
    };
  }

  return {
    kind: "valid",
    message: ""
  };
}

function validateHeight(height) {
  if (!height) {
    return {
      kind: "missing",
      message: DEFAULT_BSA_NOTE
    };
  }

  if (height <= 0) {
    return {
      kind: "invalid",
      message: "身長は0より大きい値を入力してください。"
    };
  }

  return {
    kind: "valid",
    message: ""
  };
}

function getMessageForState(state) {
  return state.kind === "valid" ? "" : state.message;
}

function setDefaultResults() {
  egfrValue.textContent = "-";
  ccrValue.textContent = "-";
  bsaValue.textContent = "-";
  egfrStage.textContent = DEFAULT_EGFR_NOTE;
  ccrNote.textContent = DEFAULT_CCR_NOTE;
  bsaNote.textContent = DEFAULT_BSA_NOTE;
}

function runCalculation() {
  const formData = new FormData(form);
  const age = Number(formData.get("age"));
  const sex = String(formData.get("sex"));
  const creatinine = Number(formData.get("creatinine"));
  const weight = Number(formData.get("weight"));
  const height = Number(formData.get("height"));
  const ageState = validateAge(age);
  const creatinineState = validateCreatinine(creatinine);
  const weightState = validateWeight(weight);
  const heightState = validateHeight(height);
  const kidneyInputsReady = ageState.kind === "valid" && creatinineState.kind === "valid";

  if (kidneyInputsReady) {
    const egfr = calculateEgfr(age, sex, creatinine);
    egfrValue.textContent = formatNumber(egfr);
    egfrStage.textContent = getEgfrStage(egfr);
  } else {
    egfrValue.textContent = "-";
    egfrStage.textContent = DEFAULT_EGFR_NOTE;
  }

  if (kidneyInputsReady && weightState.kind === "valid") {
    const ccr = calculateCcr(age, sex, creatinine, weight);
    ccrValue.textContent = formatNumber(ccr);
    ccrNote.textContent = "Cockcroft-Gault式による推算値";
  } else {
    ccrValue.textContent = "-";
    ccrNote.textContent = weightState.kind === "missing"
      ? DEFAULT_CCR_NOTE
      : "年齢・血清クレアチニン・体重を入力すると計算されます。";
  }

  if (weightState.kind === "valid" && heightState.kind === "valid") {
    const bsa = calculateBsa(height, weight);
    bsaValue.textContent = formatNumber(bsa);
    bsaNote.textContent = "藤本式による推算値";
  } else {
    bsaValue.textContent = "-";
    bsaNote.textContent = DEFAULT_BSA_NOTE;
  }

  const messages = [
    getMessageForState(ageState),
    getMessageForState(creatinineState),
    weightState.kind === "invalid" ? weightState.message : "",
    heightState.kind === "invalid" ? heightState.message : ""
  ].filter(Boolean);

  errorMessage.textContent = [...new Set(messages)].join(" ");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runCalculation();
});

calculateButton.addEventListener("click", runCalculation);

resetButton.addEventListener("click", () => {
  form.reset();
  form.querySelector('input[name="sex"][value="male"]').checked = true;
  errorMessage.textContent = "";
  setDefaultResults();
});

setDefaultResults();

if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./service-worker.js");
      if (offlineStatus) {
        offlineStatus.textContent = "この端末に保存できるよう準備しました。初回表示後はオフラインでも使えます。";
      }
    } catch (error) {
      if (offlineStatus) {
        offlineStatus.textContent = "オフライン保存の準備に失敗しました。最初はオンラインで開いてください。";
      }
    }
  });
} else if (offlineStatus) {
  offlineStatus.textContent = "ファイルを直接開いているため、オフライン保存は有効になっていません。SafariでURLを開いてください。";
}
