# app.py

from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

class Binomio:
    @staticmethod
    def sqrt(x):
        return x ** 0.5

    @staticmethod
    def abs_val(x):
        return x if x >= 0 else -x

    @staticmethod
    def exp(x, n=10):
        result = 1
        term = 1
        for i in range(1, n):
            term *= x / i
            result += term
        return result

    @staticmethod
    def log(x, n=100):
        if x <= 0:
            raise ValueError("log(x) solo está definido para x > 0")
        y = (x - 1) / (x + 1)
        result = 0
        for i in range(1, n, 2):
            result += (1 / i) * (y ** i)
        return 2 * result

    @staticmethod
    def newton_raphson_calc(fx_input, dfx_input, x0, tolerancia, max_iter):
        entorno_eval = {
            "x": 0,
            "sqrt": Binomio.sqrt,
            "abs": Binomio.abs_val,
            "exp": Binomio.exp,
            "log": Binomio.log,
        }

        def f(x):
            entorno_eval["x"] = x
            return eval(fx_input, {}, entorno_eval)

        def f_derivada(x):
            entorno_eval["x"] = x
            return eval(dfx_input, {}, entorno_eval)

        results = []
        x_values = []
        y_values = [] # Para la gráfica de f(x)
        x_axis_for_graph = [] # Eje x para la gráfica de f(x)

        iteracion = 0
        x_actual = x0
        while iteracion < max_iter:
            fx = f(x_actual)
            dfx = f_derivada(x_actual)

            # Para la gráfica, evaluamos la función en un rango para ver la raíz
            if iteracion == 0:
                # Generar puntos alrededor de x0 para la gráfica de f(x)
                start_x = x_actual - 5
                end_x = x_actual + 5
                step = (end_x - start_x) / 100
                current_graph_x = start_x
                while current_graph_x <= end_x:
                    x_axis_for_graph.append(current_graph_x)
                    y_values.append(f(current_graph_x))
                    current_graph_x += step

            if dfx == 0:
                return {"success": False, "message": f"Derivada igual a cero en x = {x_actual}. No se puede continuar.", "results": results}

            x_siguiente = x_actual - fx / dfx
            error = Binomio.abs_val(x_siguiente - x_actual)

            results.append({
                "iteracion": iteracion + 1,
                "x_n": f"{x_actual:.8f}",
                "f_xn": f"{fx:.8f}",
                "df_xn": f"{dfx:.8f}",
                "error": f"{error:.8f}"
            })
            x_values.append(x_actual) # Para marcar los puntos de iteración en la gráfica

            if error < tolerancia:
                results.append({"final_message": f"Raíz encontrada con tolerancia aceptable. Raíz aproximada: {x_siguiente:.8f}"})
                return {"success": True, "results": results, "final_root": x_siguiente, "x_values_iterations": x_values, "x_axis_for_graph": x_axis_for_graph, "y_values_for_graph": y_values}

            x_actual = x_siguiente
            iteracion += 1

        results.append({"final_message": f"No se alcanzó la tolerancia deseada en el número máximo de iteraciones. Último valor calculado: {x_actual:.8f}"})
        return {"success": True, "results": results, "final_root": x_actual, "x_values_iterations": x_values, "x_axis_for_graph": x_axis_for_graph, "y_values_for_graph": y_values}



class EcuacionesDiferenciales:
    _entorno_eval = {
        "x": 0,
        "y": 0,
        "sqrt": Binomio.sqrt,
        "abs": Binomio.abs_val,
        "exp": Binomio.exp,
        "log": Binomio.log,
    }

    @staticmethod
    def _get_f_from_input(fxy_input):
        def f(x, y):
            EcuacionesDiferenciales._entorno_eval["x"] = x
            EcuacionesDiferenciales._entorno_eval["y"] = y
            return eval(fxy_input, {}, EcuacionesDiferenciales._entorno_eval)
        return f

    @staticmethod
    def runge_kutta_calc(fxy_input, x0, y0, h, x_final, orden):
        f = EcuacionesDiferenciales._get_f_from_input(fxy_input)
        
        results = []
        x_points = []
        y_points = []

        x_actual = x0
        y_actual = y0
        paso = 0

        results.append({
            "paso": paso,
            "x": f"{x_actual:.8f}",
            "y": f"{y_actual:.8f}"
        })
        x_points.append(x_actual)
        y_points.append(y_actual)

        while x_actual < x_final:
            if x_actual + h > x_final:
                h_step = x_final - x_actual
            else:
                h_step = h

            if orden == 1: # Método de Euler
                k1 = f(x_actual, y_actual)
                y_actual += h_step * k1
            elif orden == 2: # Método de Euler Mejorado (o Punto Medio)
                k1 = f(x_actual, y_actual)
                k2 = f(x_actual + h_step, y_actual + h_step * k1)
                y_actual += (h_step / 2) * (k1 + k2)
            elif orden == 3:
                k1 = f(x_actual, y_actual)
                k2 = f(x_actual + 0.5 * h_step, y_actual + 0.5 * h_step * k1)
                k3 = f(x_actual + h_step, y_actual - h_step * k1 + 2 * h_step * k2)
                y_actual += (h_step / 6) * (k1 + 4 * k2 + k3)
            elif orden == 4: # Método de Runge-Kutta de 4to Orden
                k1 = f(x_actual, y_actual)
                k2 = f(x_actual + 0.5 * h_step, y_actual + 0.5 * h_step * k1)
                k3 = f(x_actual + 0.5 * h_step, y_actual + 0.5 * h_step * k2)
                k4 = f(x_actual + h_step, y_actual + h_step * k3)
                y_actual += (h_step / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
            else:
                return {"success": False, "message": "Orden de Runge-Kutta no soportado. Elige 1, 2, 3 o 4."}

            x_actual += h_step
            paso += 1

            results.append({
                "paso": paso,
                "x": f"{x_actual:.8f}",
                "y": f"{y_actual:.8f}"
            })
            x_points.append(x_actual)
            y_points.append(y_actual)

        results.append({"final_message": f"Simulación de Runge-Kutta finalizada. Valor final aproximado de y en x = {x_final:.8f}: {y_actual:.8f}"})
        return {"success": True, "results": results, "x_points": x_points, "y_points": y_points}


# --- Rutas de Flask ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate_newton_raphson', methods=['POST'])
def calculate_newton_raphson():
    data = request.json
    fx_input = data['fx_input']
    dfx_input = data['dfx_input']
    x0 = float(data['x0'])
    tolerancia = float(data['tolerancia'])
    max_iter = int(data['max_iter'])

    result = Binomio.newton_raphson_calc(fx_input, dfx_input, x0, tolerancia, max_iter)
    return jsonify(result)

@app.route('/calculate_runge_kutta', methods=['POST'])
def calculate_runge_kutta():
    data = request.json
    fxy_input = data['fxy_input']
    x0 = float(data['x0'])
    y0 = float(data['y0'])
    h = float(data['h'])
    x_final = float(data['x_final'])
    orden = int(data['orden'])

    result = EcuacionesDiferenciales.runge_kutta_calc(fxy_input, x0, y0, h, x_final, orden)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)