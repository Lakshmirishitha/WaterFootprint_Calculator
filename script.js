// --- Global Variables ---
let lastTotalUsage = 0; // Global variable to track usage for notifications
let usageChart;         // Global variable for the Chart.js instance
let isInitialLoad = true; // Flag to handle the first database load

// Water-saving tips (in Liters) - UPDATED MESSAGES
const usageTips = [
    { threshold: 5, message: "🚨 **WARNING! 5 Liters Reached.** You've exceeded the suggested usage limit. Reduce consumption immediately." },
    { threshold: 10, message: "💧 **Water Saving Tip:** 10 Liters used. To save water, try turning off the tap while scrubbing dishes or brushing teeth." },
    { threshold: 25, message: "🌊 **Water Saving Tip:** 25 Liters used. Check for leaky faucets or pipes; small drips waste hundreds of liters a week." },
    { threshold: 50, message: "📉 **Water Saving Tip:** 50 Liters used. Consider reducing your shower time to conserve significantly." }
];

// --- Notification Functions ---

function showNotification(message) {
    const container = document.getElementById('notificationContainer');
    if (!container) return; 

    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-warning alert-dismissible fade show fixed-bottom-right';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    container.prepend(alertDiv);
    
    setTimeout(() => {
        // Use Bootstrap's method to correctly close the alert
        const alertInstance = bootstrap.Alert.getInstance(alertDiv) || new bootstrap.Alert(alertDiv);
        alertInstance.close();
    }, 5000);
}

function checkAndTriggerNotifications(currentTotal) {
    const currentLiters = Math.floor(currentTotal);
    const lastLiters = Math.floor(lastTotalUsage);

    // 1. Message for every 1 Liter of usage (if current usage increased)
    if (currentLiters > lastLiters) {
        for (let i = lastLiters + 1; i <= currentLiters; i++) {
            setTimeout(() => {
                showNotification(`✅ **POPUP!** Total usage has reached ${i} Liters.`);
            }, (i - lastLiters - 1) * 500); 
        }
    }

    // 2. Tips/Warnings when threshold is reached
    usageTips.forEach(tip => {
        // Trigger if current total meets or exceeds threshold AND the last recorded total was below it
        if (currentTotal >= tip.threshold && lastTotalUsage < tip.threshold) {
             showNotification(tip.message);
        }
    });

    // Update the tracker for the next cycle
    lastTotalUsage = currentTotal;
}


// --- Chart Functions (12-Hour Bar Chart) ---

function initializeChart() {
    const ctx = document.getElementById('usageChart').getContext('2d');
    if (!ctx) {
        console.error("Canvas element for chart not found!");
        return;
    }

    usageChart = new Chart(ctx, {
        type: 'bar', // Bar Chart visualization
        data: {
            labels: [], 
            datasets: [{
                label: 'Combined Usage (Liters)',
                data: [], 
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Liters Used' } },
                x: { title: { display: true, text: 'Time (Hourly Buckets)' } }
            },
            responsive: true,
            maintainAspectRatio: false, 
            plugins: {
                legend: { display: false }
            },
            animation: false 
        }
    });
}

function updateChart(allData) {
    if (!usageChart) { 
        console.warn("Chart not initialized yet. Skipping update.");
        return;
    }

    const hours = 12; 
    const now = Date.now();
    const hourlyData = new Array(hours).fill(0);
    const labels = [];

    for (let i = hours - 1; i >= 0; i--) {
        const hourStart = new Date(now - (i * 60 * 60 * 1000));
        labels.push(hourStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }

    allData.forEach(d => {
        const timeDiffHours = (now - d.timestamp) / (60 * 60 * 1000);
        if (timeDiffHours < hours) {
            const bucketIndex = Math.floor(hours - 1 - timeDiffHours);
            const litersUsed = d.flowRateLPM / 60; 
            if (bucketIndex >= 0) {
                hourlyData[bucketIndex] += litersUsed;
            }
        }
    });
    
    usageChart.data.labels = labels;
    usageChart.data.datasets[0].data = hourlyData.map(l => l.toFixed(2));
    usageChart.update();
}


// --- Main UI Update Function ---
async function updateUI() {
  try {
    const res = await fetch('/api/live-data');
    const allData = await res.json();

    const now = Date.now();
    const todayStart = new Date(now).setHours(0, 0, 0, 0);
    const weekStart = now - (7 * 24 * 60 * 60 * 1000);
    const monthStart = now - (30 * 24 * 60 * 60 * 1000); 
    const liveWindowStart = now - (5 * 1000); 

    const tap1Data = allData.filter(d => d.sensorName === 'tap1');
    const tap2Data = allData.filter(d => d.sensorName === 'tap2');

    // 1. LIVE READINGS (L/sec)
    const tap1LiveFlowRecords = tap1Data.filter(d => d.timestamp >= liveWindowStart);
    const tap1LiveFlow = tap1LiveFlowRecords.reduce((sum, d) => sum + d.flowRateLPM, 0) / tap1LiveFlowRecords.length || 0; 
    
    const tap2LiveFlowRecords = tap2Data.filter(d => d.timestamp >= liveWindowStart);
    const tap2LiveFlow = tap2LiveFlowRecords.reduce((sum, d) => sum + d.flowRateLPM, 0) / tap2LiveFlowRecords.length || 0;

    document.getElementById('tap1LiveFlow').innerText = `${tap1LiveFlow.toFixed(2)}`;
    document.getElementById('tap2LiveFlow').innerText = `${tap2LiveFlow.toFixed(2)}`;
    
    // 2. CUMULATIVE TOTALS (Liters)
    const calculateTotal = (data, startTime) => 
        data.filter(d => d.timestamp >= startTime).reduce((sum, d) => sum + (d.flowRateLPM / 60), 0); 

    const tap1DailyTotal = calculateTotal(tap1Data, todayStart);
    const tap1WeeklyTotal = calculateTotal(tap1Data, weekStart);
    const tap2DailyTotal = calculateTotal(tap2Data, todayStart);
    const tap2WeeklyTotal = calculateTotal(tap2Data, weekStart);
    
    const totalDaily = tap1DailyTotal + tap2DailyTotal;
    const totalWeekly = tap1WeeklyTotal + tap2WeeklyTotal;
    const totalMonthly = calculateTotal(allData, monthStart);
    const totalLifetime = calculateTotal(allData, 0);

    // >>>>> THE CRUCIAL FIX FOR POP-UP BEHAVIOR <<<<<
    if (isInitialLoad) {
        // Set the tracker to the current lifetime usage on the very first run
        lastTotalUsage = totalLifetime;
        isInitialLoad = false;
    }

    document.getElementById('tap1DailyTotal').innerText = `${tap1DailyTotal.toFixed(2)} L`;
    document.getElementById('tap1WeeklyTotal').innerText = `${tap1WeeklyTotal.toFixed(2)} L`;
    document.getElementById('tap2DailyTotal').innerText = `${tap2DailyTotal.toFixed(2)} L`;
    document.getElementById('tap2WeeklyTotal').innerText = `${tap2WeeklyTotal.toFixed(2)} L`;

    document.getElementById('dailyTotal').innerText = `${totalDaily.toFixed(2)} L`;
    document.getElementById('weeklyTotal').innerText = `${totalWeekly.toFixed(2)} L`;
    document.getElementById('monthlyTotal').innerText = `${totalMonthly.toFixed(2)} L`;
    document.getElementById('lifetimeTotal').innerText = `${totalLifetime.toFixed(2)} L`;

    // 3. NOTIFICATIONS & CHART
    checkAndTriggerNotifications(totalLifetime);
    updateChart(allData);

  } catch (e) {
    // console.error('Failed to fetch data:', e); 
  }
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof Chart !== 'undefined') {
        initializeChart();
    } 
    
    setInterval(updateUI, 1000);
    updateUI();
});