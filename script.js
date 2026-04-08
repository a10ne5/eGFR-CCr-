const form = document.getElementById("calculator-form");
const calculateButton = document.getElementById("calculate-button");
const resetButton = document.getElementById("reset-button");
const errorMessage = document.getElementById("error-message");
const egfrValue = document.getElementById("egfr-value");
const ccrValue = document.getElementById("ccr-value");
const egfrStage = document.getElementById("egfr-stage");
const ccrNote = document.getElementById("ccr-note");
const offlineStatus = document.getElementById("offline-status");

function calculateEgfr(age, sex, creatinine) {
  const base = 194 * Math.pow(creatinine, -1.094) * Math.pow(age, -0.287);
  return sex === "female" ? base * 0.739 : base;
}

function calculateCcr(age, sex, creatinine, weight) {
  const base = ((140 - age) * weight) / (72 * creatinine);
  return sex === "female" ? base * 0.85 : base;
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

function validateCoreInput(age, creatinine) {
  if (!age || !creatinine) {
    return "年齢と血清クレアチニンを入力してください。";
  }

  if (age < 18) {
    return "この計算は18歳以上を想定しています。";
  }

  if (creatinine <= 0) {
    return "血清クレアチニンは0より大きい値を入力してください。";
  }

  if (age > 120) {
    return "年齢が大きすぎるようです。入力値を確認してください。";
  }

  return "";
}

function validateWeight(weight) {
  if (!weight) {
    return {
      kind: "missing",
      message: "体重未入力のためCCRは計算していません。"
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

function runCalculation() {
  const formData = new FormData(form);
  const age = Number(formData.get("age"));
  const sex = String(formData.get("sex"));
  const creatinine = Number(formData.get("creatinine"));
  const weight = Number(formData.get("weight"));

  const validationMessage = validateCoreInput(age, creatinine);
  if (validationMessage) {
    errorMessage.textContent = validationMessage;
    egfrValue.textContent = "-";
    ccrValue.textContent = "-";
    egfrStage.textContent = "入力内容を確認してください。";
    ccrNote.textContent = "体重を入力すると計算されます。";
    return;
  }

  const egfr = calculateEgfr(age, sex, creatinine);
  egfrValue.textContent = formatNumber(egfr);
  egfrStage.textContent = getEgfrStage(egfr);

  const weightState = validateWeight(weight);
  if (weightState.kind !== "valid") {
    ccrValue.textContent = "-";
    ccrNote.textContent = weightState.message;
    errorMessage.textContent = weightState.kind === "invalid" ? weightState.message : "";
    return;
  }

  errorMessage.textContent = "";

  const ccr = calculateCcr(age, sex, creatinine, weight);
  ccrValue.textContent = formatNumber(ccr);
  ccrNote.textContent = "Cockcroft-Gault式による推算値";
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
  egfrValue.textContent = "-";
  ccrValue.textContent = "-";
  egfrStage.textContent = "計算するとここに結果が表示されます。";
  ccrNote.textContent = "体重を入力すると計算されます。";
});

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
