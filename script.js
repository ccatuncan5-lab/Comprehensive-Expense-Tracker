let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let cycles = JSON.parse(localStorage.getItem("cycles")) || {};
let chart;

// ------------------- Cycle Functions -------------------
function getCycleId(dateStr){
  const date = new Date(dateStr);
  const day = date.getDate();
  return day <= 15 
    ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-05` 
    : `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-20`;
}

function setCycleSalary() {
  const dateInput = document.getElementById("salaryDate").value;
  const amount = Number(document.getElementById("salaryAmount").value);
  if (!dateInput || !amount) return alert("Enter date and salary");

  const cycleId = getCycleId(dateInput);
  const categories = {
    "Academic Allowance": amount * 0.2,
    "Academic Materials": amount * 0.2,
    "Family": amount * 0.3,
    "Travel Allowance": amount * 0.1,
    "Remaining": amount * 0.2
  };

  cycles[cycleId] = { salary: amount, categories };
  localStorage.setItem("cycles", JSON.stringify(cycles));

  updateCycleFilter();
  document.getElementById("cycleFilter").value = cycleId;

  renderAll();
  document.getElementById("salaryDate").value = "";
  document.getElementById("salaryAmount").value = "";
}

function updateCycleFilter(){
  const select = document.getElementById("cycleFilter");
  select.innerHTML = "";
  Object.keys(cycles).sort().forEach(id=>{
    const opt = document.createElement("option");
    opt.value = id;
    opt.text = id;
    select.appendChild(opt);
  });
}

// ------------------- Expense Functions -------------------
function addExpense() {
  const date = document.getElementById("date").value;
  const category = document.getElementById("category").value;
  const amount = Number(document.getElementById("amount").value);
  if(!date || !amount) return alert("Fill all fields");

  const cycleId = getCycleId(date);
  const expense = { date, category, amount, cycleId };
  expenses.push(expense);
  localStorage.setItem("expenses", JSON.stringify(expenses));

  document.getElementById("date").value="";
  document.getElementById("amount").value="";
  renderAll();
}

// ------------------- Render Functions -------------------
function renderAll(){
  renderSummary();
  renderChart();
  renderExpenses();
}

function renderSummary(){
  const cycleId = document.getElementById("cycleFilter").value;
  const summaryDiv = document.getElementById("summary");
  const cycle = cycles[cycleId];
  if(!cycle){ summaryDiv.innerHTML="No salary set"; return; }

  const cycleExpenses = expenses.filter(e=>e.cycleId===cycleId);
  let totalSpent = 0;
  let html = `<ul>`;
  Object.keys(cycle.categories).forEach(cat=>{
    const spent = cycleExpenses.filter(e=>e.category===cat).reduce((a,b)=>a+b.amount,0);
    totalSpent += spent;
    html += `<li>${cat}: ₱${spent.toFixed(2)} / ₱${cycle.categories[cat].toFixed(2)}</li>`;
  });
  html += `</ul><b>Total Spent: ₱${totalSpent.toFixed(2)} / ₱${cycle.salary.toFixed(2)}</b>`;
  summaryDiv.innerHTML = html;

  if(totalSpent > cycle.salary) alert("Warning: Expenses exceed salary!");
}

function renderChart(){
  const cycleId = document.getElementById("cycleFilter").value;
  const cycle = cycles[cycleId];
  if(!cycle) return;

  const cycleExpenses = expenses.filter(e=>e.cycleId===cycleId);
  let totals = {};
  Object.keys(cycle.categories).forEach(cat=>{
    totals[cat] = cycleExpenses.filter(e=>e.category===cat).reduce((a,b)=>a+b.amount,0);
  });

  if(chart) chart.destroy();
  chart = new Chart(document.getElementById("chart"),{
    type:'pie',
    data:{
      labels:Object.keys(totals),
      datasets:[{
        data:Object.values(totals),
        backgroundColor:['#007aff','#5856d6','#ff3b30','#34c759','#ff9500'],
        borderColor:'#fff',
        borderWidth:2
      }]
    },
    options:{
      responsive:true,
      plugins:{
        tooltip:{
          callbacks:{
            label:function(context){
              const label=context.label||'';
              const value=context.raw||0;
              const total=Object.values(totals).reduce((a,b)=>a+b,0);
              const percent = total? ((value/total)*100).toFixed(1):0;
              return `${label}: ₱${value.toFixed(2)} (${percent}%)`;
            }
          }
        },
        legend:{ position:'bottom', labels:{ usePointStyle:true } }
      },
      animation:{ animateRotate:true, animateScale:true }
    }
  });
}

function renderExpenses(){
  const cycleId = document.getElementById("cycleFilter").value;
  const tbody = document.querySelector("#expenseTable tbody");
  const cycleExpenses = expenses.filter(e=>e.cycleId===cycleId);
  tbody.innerHTML = cycleExpenses.map((e,i)=>`
    <tr>
      <td>${e.date}</td>
      <td>${e.category}</td>
      <td>₱${e.amount.toFixed(2)}</td>
      <td>
        <button onclick="editExpense(${i})">Edit</button>
        <button onclick="deleteExpense(${i})">Delete</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="4">No expenses</td></tr>`;
}

// ------------------- Edit/Delete -------------------
function editExpense(index){
  const e = expenses[index];
  document.getElementById("date").value = e.date;
  document.getElementById("category").value = e.category;
  document.getElementById("amount").value = e.amount;
  deleteExpense(index);
}

function deleteExpense(index){
  expenses.splice(index,1);
  localStorage.setItem("expenses", JSON.stringify(expenses));
  renderAll();
}

// ------------------- On Load -------------------
window.addEventListener("load", ()=>{
  updateCycleFilter();
  renderAll();
});