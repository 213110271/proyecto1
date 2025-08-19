document.addEventListener('DOMContentLoaded', () => {
    const methodSelect = document.getElementById('method-select');
    const newtonRaphsonFormDiv = document.getElementById('newton-raphson-form');
    const rungeKuttaFormDiv = document.getElementById('runge-kutta-form');
    const formNewtonRaphson = document.getElementById('form-newton-raphson');
    const resultsNewtonRaphsonDiv = document.getElementById('results-newton-raphson');
    const newtonRaphsonChartCanvas = document.getElementById('newtonRaphsonChart').getContext('2d');
    let newtonRaphsonChart;

    const formRungeKutta = document.getElementById('form-runge-kutta');
    const resultsRungeKuttaDiv = document.getElementById('results-runge-kutta');
    const rungeKuttaChartCanvas = document.getElementById('rungeKuttaChart').getContext('2d');
    let rungeKuttaChart;

    const showSelectedMethodForm = () => {
        if (methodSelect.value === 'newton_raphson') {
            newtonRaphsonFormDiv.classList.remove('hidden');
            rungeKuttaFormDiv.classList.add('hidden');
        } else {
            rungeKuttaFormDiv.classList.remove('hidden');
            newtonRaphsonFormDiv.classList.add('hidden');
        }
    };

    showSelectedMethodForm();
    methodSelect.addEventListener('change', showSelectedMethodForm);

    // --- Newton-Raphson ---
    formNewtonRaphson.addEventListener('submit', async (event) => {
        event.preventDefault();
        const fx_input = document.getElementById('fx_nr').value;
        const dfx_input = document.getElementById('dfx_nr').value;
        const x0 = parseFloat(document.getElementById('x0_nr').value);
        const tolerancia = parseFloat(document.getElementById('tolerancia_nr').value);
        const max_iter = parseInt(document.getElementById('max_iter_nr').value);

        try {
            const response = await fetch('/calculate_newton_raphson', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({fx_input, dfx_input, x0, tolerancia, max_iter})
            });
            const data = await response.json();
            displayNewtonRaphsonResults(data);
        } catch (error) {
            resultsNewtonRaphsonDiv.innerHTML = `<p class="error-message">Error al conectar con el servidor: ${error.message}</p>`;
        }
    });

    const displayNewtonRaphsonResults = (data) => {
        resultsNewtonRaphsonDiv.innerHTML = '';
        if (!data.success) {
            resultsNewtonRaphsonDiv.innerHTML = `<p class="error-message">${data.message}</p>`;
            return;
        }
        let tableHtml = '<table class="results-table"><thead><tr><th>Iteración</th><th>x</th><th>f(x)</th><th>f\'(x)</th><th>Error</th></tr></thead><tbody>';
        let finalMessage = '';
        data.results.forEach(row => {
            if (row.final_message) finalMessage = `<p class="final-message">${row.final_message}</p>`;
            else tableHtml += `<tr><td>${row.iteracion}</td><td>${row.x_n}</td><td>${row.f_xn}</td><td>${row.df_xn}</td><td>${row.error}</td></tr>`;
        });
        tableHtml += '</tbody></table>';
        resultsNewtonRaphsonDiv.innerHTML += tableHtml + finalMessage;
        drawNewtonRaphsonChart(data);
    };

    const drawNewtonRaphsonChart = (data) => {
        if (newtonRaphsonChart) newtonRaphsonChart.destroy();

        const labels = data.x_axis_for_graph;
        const functionData = data.y_values_for_graph;
        const iterationPoints = data.x_values_iterations;
        const finalRoot = data.final_root;

        const f_input = document.getElementById('fx_nr').value;
        const f = new Function('x', 'sqrt','abs','exp','log', `return ${f_input}`);

        const datasets = [{
            label: 'f(x)',
            data: labels.map((x,i)=>({x:x,y:functionData[i]})),
            borderColor: 'rgb(75,192,192)',
            borderWidth: 2,
            fill: false,
            tension: 0.1,
            pointRadius: 0
        }];

        if (iterationPoints && iterationPoints.length>0) {
            const iterationYValues = iterationPoints.map(x=>{
                try { return f(x, Math.sqrt, Math.abs, Math.exp, Math.log); }
                catch(e) { return null; }
            });
            datasets.push({
                label:'Iteraciones x_n',
                data: iterationPoints.map((x,i)=>({x:x,y:iterationYValues[i]})),
                backgroundColor:'rgb(255,99,132)',
                borderColor:'rgb(255,99,132)',
                type:'scatter',
                pointRadius:5
            });
        }

        if(finalRoot!==undefined && finalRoot!==null){
            datasets.push({
                label:'Raíz Aproximada',
                data:[{x:finalRoot,y:0}],
                backgroundColor:'rgb(54,162,235)',
                borderColor:'rgb(54,162,235)',
                type:'scatter',
                pointRadius:7,
                pointStyle:'crossRot',
                pointBorderWidth:2
            });
        }

        newtonRaphsonChart = new Chart(newtonRaphsonChartCanvas,{
            type:'line',
            data:{labels:labels,datasets:datasets},
            options:{
                responsive:true,
                maintainAspectRatio:false,
                scales:{x:{type:'linear',position:'bottom',title:{display:true,text:'x'}},
                        y:{title:{display:true,text:'f(x)'}}}
            }
        });
    };

    // --- Runge-Kutta ---
    formRungeKutta.addEventListener('submit', async event=>{
        event.preventDefault();
        const fxy_input=document.getElementById('fxy_rk').value;
        const x0=parseFloat(document.getElementById('x0_rk').value);
        const y0=parseFloat(document.getElementById('y0_rk').value);
        const h=parseFloat(document.getElementById('h_rk').value);
        const x_final=parseFloat(document.getElementById('x_final_rk').value);
        const orden=parseInt(document.getElementById('orden_rk').value);

        try{
            const response=await fetch('/calculate_runge_kutta',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({fxy_input,x0,y0,h,x_final,orden})
            });
            const data=await response.json();
            displayRungeKuttaResults(data);
        }catch(error){
            resultsRungeKuttaDiv.innerHTML=`<p class="error-message">Error al conectar con el servidor: ${error.message}</p>`;
        }
    });

    const displayRungeKuttaResults=data=>{
        resultsRungeKuttaDiv.innerHTML='';
        if(!data.success){
            resultsRungeKuttaDiv.innerHTML=`<p class="error-message">${data.message}</p>`;
            return;
        }
        let tableHtml='<table class="results-table"><thead><tr><th>Paso</th><th>x</th><th>y</th></tr></thead><tbody>';
        let finalMessage='';
        data.results.forEach(row=>{
            if(row.final_message) finalMessage=`<p class="final-message">${row.final_message}</p>`;
            else tableHtml+=`<tr><td>${row.paso}</td><td>${row.x}</td><td>${row.y}</td></tr>`;
        });
        tableHtml+='</tbody></table>';
        resultsRungeKuttaDiv.innerHTML+=tableHtml+finalMessage;
        drawRungeKuttaChart(data);
    };

    const drawRungeKuttaChart=data=>{
        if(rungeKuttaChart) rungeKuttaChart.destroy();
        rungeKuttaChart=new Chart(rungeKuttaChartCanvas,{
            type:'line',
            data:{labels:data.x_points,datasets:[{
                label:'y(x)',
                data:data.y_points,
                borderColor:'rgb(255,159,64)',
                backgroundColor:'rgba(255,159,64,0.2)',
                fill:false,
                tension:0.1,
                pointRadius:3
            }]},
            options:{responsive:true,maintainAspectRatio:false,scales:{x:{type:'linear',position:'bottom',title:{display:true,text:'x'}},y:{title:{display:true,text:'y'}}}}
        });
    };
});
