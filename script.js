const STORAGE_KEY = "meltdownLogs";

function getDefaultSampleLogs() {
    return [
        { date: "2026-01-15", sleepHours: 8, noiseLevel: "Low", sugarAfter6: "No", screenAfter7: "No", routineChange: "No", mealAfter7: "No", meltdownOccurred: "No" },
        { date: "2026-01-16", sleepHours: 6, noiseLevel: "High", sugarAfter6: "Yes", screenAfter7: "Yes", routineChange: "Yes", mealAfter7: "Yes", meltdownOccurred: "Yes" },
        { date: "2026-01-17", sleepHours: 7.5, noiseLevel: "Medium", sugarAfter6: "No", screenAfter7: "No", routineChange: "No", mealAfter7: "No", meltdownOccurred: "No" },
        { date: "2026-01-18", sleepHours: 5.5, noiseLevel: "High", sugarAfter6: "Yes", screenAfter7: "Yes", routineChange: "No", mealAfter7: "Yes", meltdownOccurred: "Yes" },
        { date: "2026-01-20", sleepHours: 8.5, noiseLevel: "Low", sugarAfter6: "No", screenAfter7: "No", routineChange: "No", mealAfter7: "No", meltdownOccurred: "No" },
        { date: "2026-01-21", sleepHours: 6.5, noiseLevel: "Medium", sugarAfter6: "No", screenAfter7: "Yes", routineChange: "Yes", mealAfter7: "No", meltdownOccurred: "Yes" },
        { date: "2026-01-22", sleepHours: 7, noiseLevel: "Low", sugarAfter6: "No", screenAfter7: "No", routineChange: "No", mealAfter7: "No", meltdownOccurred: "No" },
        { date: "2026-01-23", sleepHours: 5, noiseLevel: "High", sugarAfter6: "Yes", screenAfter7: "Yes", routineChange: "Yes", mealAfter7: "Yes", meltdownOccurred: "Yes" },
        { date: "2026-01-25", sleepHours: 8, noiseLevel: "Medium", sugarAfter6: "No", screenAfter7: "No", routineChange: "No", mealAfter7: "No", meltdownOccurred: "No" },
        { date: "2026-01-26", sleepHours: 7, noiseLevel: "High", sugarAfter6: "No", screenAfter7: "Yes", routineChange: "No", mealAfter7: "Yes", meltdownOccurred: "Yes" },
        { date: "2026-01-27", sleepHours: 9, noiseLevel: "Low", sugarAfter6: "No", screenAfter7: "No", routineChange: "No", mealAfter7: "No", meltdownOccurred: "No" },
        { date: "2026-01-28", sleepHours: 6, noiseLevel: "Medium", sugarAfter6: "Yes", screenAfter7: "Yes", routineChange: "Yes", mealAfter7: "Yes", meltdownOccurred: "Yes" },
        { date: "2026-01-30", sleepHours: 7.5, noiseLevel: "Low", sugarAfter6: "No", screenAfter7: "No", routineChange: "No", mealAfter7: "No", meltdownOccurred: "No" },
        { date: "2026-01-31", sleepHours: 6.5, noiseLevel: "High", sugarAfter6: "No", screenAfter7: "Yes", routineChange: "Yes", mealAfter7: "No", meltdownOccurred: "Yes" },
        { date: "2026-02-02", sleepHours: 8, noiseLevel: "Medium", sugarAfter6: "No", screenAfter7: "No", routineChange: "No", mealAfter7: "No", meltdownOccurred: "No" },
        { date: "2026-02-03", sleepHours: 4.5, noiseLevel: "High", sugarAfter6: "Yes", screenAfter7: "Yes", routineChange: "Yes", mealAfter7: "Yes", meltdownOccurred: "Yes" },
        { date: "2026-02-04", sleepHours: 7, noiseLevel: "Low", sugarAfter6: "No", screenAfter7: "No", routineChange: "No", mealAfter7: "No", meltdownOccurred: "No" },
        { date: "2026-02-06", sleepHours: 6, noiseLevel: "High", sugarAfter6: "Yes", screenAfter7: "Yes", routineChange: "No", mealAfter7: "Yes", meltdownOccurred: "Yes" },
        { date: "2026-02-07", sleepHours: 8.5, noiseLevel: "Low", sugarAfter6: "No", screenAfter7: "No", routineChange: "No", mealAfter7: "No", meltdownOccurred: "No" },
        { date: "2026-02-08", sleepHours: 7, noiseLevel: "Medium", sugarAfter6: "No", screenAfter7: "Yes", routineChange: "Yes", mealAfter7: "Yes", meltdownOccurred: "No" },
        { date: "2026-02-10", sleepHours: 6.5, noiseLevel: "High", sugarAfter6: "No", screenAfter7: "Yes", routineChange: "No", mealAfter7: "Yes", meltdownOccurred: "Yes" },
    ];
}

const LOGS_VISIBLE_COUNT = 6;

const logForm = document.getElementById("logForm");
const logsTableBody = document.querySelector("#logsTable tbody");
const emptyState = document.getElementById("emptyState");
const toggleLogsBtn = document.getElementById("toggleLogsBtn");
const insightsDiv = document.getElementById("insights");
const sampleDataBtn = document.getElementById("sampleDataBtn");
const analyzeBtn = document.getElementById("analyzeBtn");
const clearBtn = document.getElementById("clearBtn");

let logsExpanded = false;

function getLogs() {
    const logs = localStorage.getItem(STORAGE_KEY);
    return logs ? JSON.parse(logs) : [];
}

function saveLogs(logs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

function renderLogs() {
    const logs = getLogs();
    logsTableBody.innerHTML = "";

    if (logs.length === 0) {
        emptyState.style.display = "block";
        toggleLogsBtn.style.display = "none";
        return;
    }

    emptyState.style.display = "none";

    const sortedLogs = [...logs].sort((a, b) => (b.date > a.date ? 1 : -1));
    const toShow = logsExpanded || logs.length <= LOGS_VISIBLE_COUNT
        ? sortedLogs
        : sortedLogs.slice(0, LOGS_VISIBLE_COUNT);

    toShow.forEach((log) => {
        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${log.date}</td>
      <td>${log.sleepHours}</td>
      <td>${log.noiseLevel}</td>
      <td>${log.sugarAfter6}</td>
      <td>${log.screenAfter7}</td>
      <td>${log.routineChange}</td>
      <td>${log.mealAfter7}</td>
      <td>${log.meltdownOccurred}</td>
    `;
        logsTableBody.appendChild(row);
    });

    if (logs.length > LOGS_VISIBLE_COUNT) {
        toggleLogsBtn.style.display = "inline-block";
        toggleLogsBtn.textContent = logsExpanded
            ? `Show less (${LOGS_VISIBLE_COUNT})`
            : `View all (${logs.length})`;
    } else {
        toggleLogsBtn.style.display = "none";
    }
}

function addLog(log) {
    const logs = getLogs();
    logs.push(log);
    saveLogs(logs);
    renderLogs();
}

function meltdownRate(conditionFn) {
    const logs = getLogs();
    const filtered = logs.filter(conditionFn);

    if (filtered.length === 0) {
        return null;
    }

    const meltdownCount = filtered.filter(
        (log) => log.meltdownOccurred === "Yes"
    ).length;

    return {
        total: filtered.length,
        meltdowns: meltdownCount,
        rate: (meltdownCount / filtered.length) * 100,
    };
}

function analyzePatterns() {
    const logs = getLogs();

    if (logs.length < 3) {
        if (triggerChartInstance) {
            triggerChartInstance.destroy();
            triggerChartInstance = null;
        }
        insightsDiv.innerHTML = `
      <div class="warning-box">
        Please add at least 3 logs so the analysis makes sense.
      </div>
    `;
        return;
    }

    const patternDefs = [
        {
            name: "Sleep below 7 hours",
            whenPresent: (log) => Number(log.sleepHours) < 7,
            explanation:
                "Lower sleep may increase stress, irritability, or sensitivity to sensory input.",
        },
        {
            name: "High sensory environment",
            whenPresent: (log) => log.noiseLevel === "High",
            explanation:
                "Loud environments may contribute to sensory overload and emotional distress.",
        },
        {
            name: "Late sugar intake",
            whenPresent: (log) => log.sugarAfter6 === "Yes",
            explanation:
                "Late sugar intake may be linked to energy spikes and difficulty regulating emotions.",
        },
        {
            name: "Late screen exposure",
            whenPresent: (log) => log.screenAfter7 === "Yes",
            explanation:
                "Late screen exposure may interfere with sleep preparation and emotional regulation.",
        },
        {
            name: "Routine change",
            whenPresent: (log) => log.routineChange === "Yes",
            explanation:
                "Unexpected routine changes may increase anxiety and difficulty with transitions.",
        },
        {
            name: "Late meal",
            whenPresent: (log) => log.mealAfter7 === "Yes",
            explanation:
                "Late meals may be connected to discomfort, disrupted routine, or sleep issues.",
        },
    ];

    const patterns = patternDefs.map((def) => ({
        ...def,
        whenPresentData: meltdownRate(def.whenPresent),
        whenAbsentData: meltdownRate((log) => !def.whenPresent(log)),
    }));

    let html = "";

    const overallMeltdownRate = meltdownRate(() => true);
    html += `
    <div class="insight-box">
      <strong>Overall meltdown rate:</strong>
      ${overallMeltdownRate.rate.toFixed(1)}% 
      (${overallMeltdownRate.meltdowns} out of ${overallMeltdownRate.total} logs)
    </div>
  `;

    patterns.forEach((pattern) => {
        const present = pattern.whenPresentData;
        const absent = pattern.whenAbsentData;
        if (!present && !absent) return;

        const presentStr = present
            ? `${present.rate.toFixed(1)}% when present (${present.meltdowns}/${present.total})`
            : "no data when present";
        const absentStr = absent
            ? `${absent.rate.toFixed(1)}% when absent (${absent.meltdowns}/${absent.total})`
            : "no data when absent";

        html += `
      <div class="insight-box">
        <strong>${pattern.name}</strong><br>
        Meltdown rate: <strong>${presentStr}</strong><br>
        vs ${absentStr}<br><br>
        <em>${pattern.explanation}</em>
      </div>
    `;
    });

    const strongTriggers = patterns
        .filter((p) => p.whenPresentData && p.whenPresentData.total >= 1)
        .map((p) => ({
            ...p,
            lift:
                p.whenPresentData.rate -
                (p.whenAbsentData ? p.whenAbsentData.rate : 0),
        }))
        .sort((a, b) => b.lift - a.lift)
        .slice(0, 3);

    if (strongTriggers.length > 0) {
        html += `
      <div class="warning-box">
        <strong>Top possible triggers (biggest difference vs. baseline):</strong><br>
        ${strongTriggers
                .map(
                    (trigger, index) =>
                        `${index + 1}. ${trigger.name} (+${trigger.lift.toFixed(0)}% when present vs absent)`
                )
                .join("<br>")}
      </div>
    `;
    }

    html += `
    <div class="warning-box">
      <strong>Important:</strong> This tool does not diagnose autism or predict behavior with certainty.
      It is designed to help caregivers notice patterns that may support better routine planning and understanding.
    </div>
  `;

    const chartCard = `
    <div class="card">
      <h2>Trigger Visualization</h2>
      <canvas id="triggerChart"></canvas>
    </div>
  `;
    insightsDiv.innerHTML = chartCard + html;
    drawTriggerChart(patterns);
}

logForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const log = {
        date: document.getElementById("date").value,
        sleepHours: document.getElementById("sleepHours").value,
        noiseLevel: document.getElementById("noiseLevel").value,
        sugarAfter6: document.getElementById("sugarAfter6").value,
        screenAfter7: document.getElementById("screenAfter7").value,
        routineChange: document.getElementById("routineChange").value,
        mealAfter7: document.getElementById("mealAfter7").value,
        meltdownOccurred: document.getElementById("meltdownOccurred").value,
    };

    addLog(log);
    logForm.reset();
});

sampleDataBtn.addEventListener("click", function () {
    saveLogs(getDefaultSampleLogs());
    logsExpanded = false;
    renderLogs();
    if (triggerChartInstance) {
        triggerChartInstance.destroy();
        triggerChartInstance = null;
    }
    insightsDiv.innerHTML = `
    <div class="insight-box">
      Sample data loaded. Now click <strong>Analyze Patterns</strong>.
    </div>
  `;
});

analyzeBtn.addEventListener("click", analyzePatterns);

toggleLogsBtn.addEventListener("click", function () {
    logsExpanded = !logsExpanded;
    renderLogs();
});

clearBtn.addEventListener("click", function () {
    localStorage.removeItem(STORAGE_KEY);
    logsExpanded = false;
    renderLogs();
    if (triggerChartInstance) {
        triggerChartInstance.destroy();
        triggerChartInstance = null;
    }
    insightsDiv.innerHTML = `
    <div class="card">
      <h2>Trigger Visualization</h2>
      <canvas id="triggerChart"></canvas>
    </div>
    Click <strong>Analyze Patterns</strong> to see possible triggers.`;
});

let triggerChartInstance = null;

function drawTriggerChart(patterns) {
    const ctx = document.getElementById("triggerChart");
    if (!ctx) return;

    const withData = patterns.filter(
        (p) => p.whenPresentData || p.whenAbsentData
    );
    if (withData.length === 0) return;

    if (triggerChartInstance) {
        triggerChartInstance.destroy();
        triggerChartInstance = null;
    }

    const labels = withData.map((p) => p.name);
    const whenPresentValues = withData.map((p) =>
        p.whenPresentData ? p.whenPresentData.rate : null
    );
    const whenAbsentValues = withData.map((p) =>
        p.whenAbsentData ? p.whenAbsentData.rate : null
    );

    triggerChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "When condition present",
                    data: whenPresentValues,
                    backgroundColor: "rgba(220, 38, 38, 0.7)",
                },
                {
                    label: "When condition absent",
                    data: whenAbsentValues,
                    backgroundColor: "rgba(34, 197, 94, 0.7)",
                },
            ],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: "Meltdown rate (%)" },
                },
            },
        },
    });
}

if (getLogs().length === 0) {
    saveLogs(getDefaultSampleLogs());
}
renderLogs();