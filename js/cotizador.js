class CotizadorMadTech {
    constructor() {
        this.productos = [];
        this.numeroCotizacion = this.generarNumeroCotizacion();
        this.inicializarEventos();
        this.actualizarFecha();
        this.cargarCotizacionGuardada();
    }

    generarNumeroCotizacion() {
        const fecha = new Date();
        const año = fecha.getFullYear().toString().substr(-2);
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const dia = fecha.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `MT-${año}${mes}${dia}-${random}`;
    }

    actualizarFecha() {
        const fecha = new Date();
        const opciones = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('fecha-actual').textContent = 
            fecha.toLocaleDateString('es-ES', opciones);
        document.getElementById('cotizacion-numero').textContent = 
            this.numeroCotizacion;
    }

    inicializarEventos() {
        // Botones principales
        document.getElementById('agregar-producto').addEventListener('click', () => 
            this.agregarProducto());
        
        document.getElementById('imprimir-cotizacion').addEventListener('click', () => 
            this.imprimirCotizacion());
        
        document.getElementById('limpiar-cotizacion').addEventListener('click', () => 
            this.limpiarCotizacion());
        
        document.getElementById('guardar-cotizacion').addEventListener('click', () => 
            this.guardarCotizacion());
        
        document.getElementById('ver-historial').addEventListener('click', () => 
            this.verHistorial());
        
        document.getElementById('exportar-pdf').addEventListener('click', () => 
            this.exportarPDF());
        
        // Inputs de cálculo
        document.getElementById('descuento-global').addEventListener('input', () => 
            this.calcularTotales());
        
        // Cargar cotización si existe
        window.addEventListener('beforeunload', () => this.guardarCotizacion());
    }

    agregarProducto() {
        const producto = {
            id: Date.now(),
            descripcion: '',
            cantidad: 1,
            precioUnitario: 0,
            descuento: 0
        };
        
        this.productos.push(producto);
        this.renderizarProductos();
        this.calcularTotales();
    }

    eliminarProducto(id) {
        this.productos = this.productos.filter(p => p.id !== id);
        this.renderizarProductos();
        this.calcularTotales();
    }

    actualizarProducto(id, campo, valor) {
        const producto = this.productos.find(p => p.id === id);
        if (producto) {
            if (campo === 'cantidad' || campo === 'precioUnitario' || campo === 'descuento') {
                producto[campo] = parseFloat(valor) || 0;
            } else {
                producto[campo] = valor;
            }
            this.calcularTotales();
        }
    }

    renderizarProductos() {
        const tbody = document.querySelector('#productos-table tbody');
        tbody.innerHTML = '';

        this.productos.forEach(producto => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="text" class="producto-input" 
                           value="${producto.descripcion}" 
                           placeholder="Descripción del producto/servicio"
                           onchange="cotizador.actualizarProducto(${producto.id}, 'descripcion', this.value)">
                </td>
                <td>
                    <input type="number" class="producto-input" 
                           value="${producto.cantidad}" 
                           min="1"
                           onchange="cotizador.actualizarProducto(${producto.id}, 'cantidad', this.value)">
                </td>
                <td>
                    <input type="number" class="producto-input" 
                           value="${producto.precioUnitario}" 
                           step="0.01" min="0"
                           onchange="cotizador.actualizarProducto(${producto.id}, 'precioUnitario', this.value)">
                </td>
                <td>
                    <input type="number" class="producto-input" 
                           value="${producto.descuento}" 
                           min="0" max="100"
                           onchange="cotizador.actualizarProducto(${producto.id}, 'descuento', this.value)">
                </td>
                <td>
                    $${this.calcularTotalProducto(producto).toFixed(2)}
                </td>
                <td>
                    <button class="btn-eliminar" onclick="cotizador.eliminarProducto(${producto.id})">
                        Eliminar
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    calcularTotalProducto(producto) {
        const subtotal = producto.cantidad * producto.precioUnitario;
        const descuento = (subtotal * producto.descuento) / 100;
        return subtotal - descuento;
    }

    calcularTotales() {
        // Calcular subtotal
        const subtotal = this.productos.reduce((sum, producto) => 
            sum + (producto.cantidad * producto.precioUnitario), 0);
        
        // Aplicar descuento global
        const descuentoGlobal = parseFloat(document.getElementById('descuento-global').value) || 0;
        const descuentoMonto = (subtotal * descuentoGlobal) / 100;
        const subtotalConDescuento = subtotal - descuentoMonto;
        
        // Calcular IVA (19%)
        const iva = subtotalConDescuento * 0.19;
        
        // Calcular total final
        const total = subtotalConDescuento + iva;
        
        // Actualizar interfaz
        document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('subtotal-descuento').textContent = `$${subtotalConDescuento.toFixed(2)}`;
        document.getElementById('iva').textContent = `$${iva.toFixed(2)}`;
        document.getElementById('total-final').innerHTML = `<strong>$${total.toFixed(2)}</strong>`;
    }

    imprimirCotizacion() {
        // Validar datos mínimos
        const nombreCliente = document.getElementById('nombre-cliente').value;
        if (!nombreCliente) {
            alert('Por favor ingrese el nombre del cliente');
            return;
        }
        
        if (this.productos.length === 0) {
            alert('Por favor agregue al menos un producto/servicio');
            return;
        }
        
        window.print();
    }

    async exportarPDF() {
        // Validar datos mínimos
        const nombreCliente = document.getElementById('nombre-cliente').value;
        if (!nombreCliente) {
            alert('Por favor ingrese el nombre del cliente');
            return;
        }
        
        if (this.productos.length === 0) {
            alert('Por favor agregue al menos un producto/servicio');
            return;
        }

        try {
            // Mostrar mensaje de carga
            const botonExportar = document.getElementById('exportar-pdf');
            const textoOriginal = botonExportar.innerHTML;
            botonExportar.innerHTML = ' Generando PDF...';
            botonExportar.disabled = true;

            // Usar jsPDF para generar el PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Configuración del PDF
            const margin = 20;
            let y = 20;

            // Encabezado
            doc.setFontSize(20);
            doc.setTextColor(44, 62, 80);
            doc.text('MadTech Solutions', margin, y);
            
            doc.setFontSize(12);
            doc.setTextColor(127, 140, 141);
            y += 8;
            doc.text('Soluciones Tecnológicas Avanzadas', margin, y);
            
            // Información de cotización
            doc.setFontSize(16);
            doc.setTextColor(231, 76, 60);
            y += 15;
            doc.text('COTIZACIÓN', 150, y);
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            y += 8;
            doc.text(`N°: ${this.numeroCotizacion}`, 150, y);
            y += 6;
            doc.text(`Fecha: ${document.getElementById('fecha-actual').textContent}`, 150, y);

            // Línea divisoria
            doc.setDrawColor(52, 152, 219);
            doc.setLineWidth(0.5);
            y += 10;
            doc.line(margin, y, 190, y);

            // Datos del cliente
            doc.setFontSize(12);
            doc.setTextColor(44, 62, 80);
            y += 10;
            doc.text('Datos del Cliente:', margin, y);
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            y += 8;
            doc.text(`Nombre: ${document.getElementById('nombre-cliente').value || 'No especificado'}`, margin, y);
            y += 6;
            doc.text(`Email: ${document.getElementById('email-cliente').value || 'No especificado'}`, margin, y);
            y += 6;
            doc.text(`Teléfono: ${document.getElementById('telefono-cliente').value || 'No especificado'}`, margin, y);
            y += 6;
            doc.text(`Dirección: ${document.getElementById('direccion-cliente').value || 'No especificado'}`, margin, y);

            // Línea divisoria
            y += 10;
            doc.line(margin, y, 190, y);

            // Tabla de productos
            y += 10;
            doc.setFontSize(12);
            doc.setTextColor(44, 62, 80);
            doc.text('Productos/Servicios:', margin, y);
            
            // Encabezados de tabla
            y += 10;
            doc.setFontSize(9);
            doc.setTextColor(255, 255, 255);
            doc.setFillColor(52, 152, 219);
            doc.rect(margin, y, 170, 8, 'F');
            doc.text('Descripción', margin + 2, y + 5);
            doc.text('Cant.', margin + 80, y + 5);
            doc.text('Precio', margin + 100, y + 5);
            doc.text('Total', margin + 140, y + 5);

            // Productos
            doc.setFontSize(8);
            doc.setTextColor(0, 0, 0);
            y += 8;

            this.productos.forEach((producto, index) => {
                const totalProducto = this.calcularTotalProducto(producto);
                doc.text(producto.descripcion || 'Sin descripción', margin + 2, y + 5);
                doc.text(producto.cantidad.toString(), margin + 80, y + 5);
                doc.text(`$${producto.precioUnitario.toFixed(2)}`, margin + 100, y + 5);
                doc.text(`$${totalProducto.toFixed(2)}`, margin + 140, y + 5);
                
                y += 6;
                
                // Nueva página si es necesario
                if (y > 250) {
                    doc.addPage();
                    y = 20;
                }
            });

            // Totales
            const subtotal = this.productos.reduce((sum, producto) => 
                sum + (producto.cantidad * producto.precioUnitario), 0);
            const descuentoGlobal = parseFloat(document.getElementById('descuento-global').value) || 0;
            const descuentoMonto = (subtotal * descuentoGlobal) / 100;
            const subtotalConDescuento = subtotal - descuentoMonto;
            const iva = subtotalConDescuento * 0.19;
            const total = subtotalConDescuento + iva;

            y += 15;
            doc.setFontSize(10);
            doc.text('Subtotal:', margin + 100, y);
            doc.text(`$${subtotal.toFixed(2)}`, margin + 140, y);
            
            y += 6;
            doc.text(`Descuento (${descuentoGlobal}%):`, margin + 100, y);
            doc.text(`-$${descuentoMonto.toFixed(2)}`, margin + 140, y);
            
            y += 6;
            doc.setFontSize(11);
            doc.text('Subtotal con Descuento:', margin + 100, y);
            doc.text(`$${subtotalConDescuento.toFixed(2)}`, margin + 140, y);
            
            y += 6;
            doc.text('IVA (19%):', margin + 100, y);
            doc.text(`$${iva.toFixed(2)}`, margin + 140, y);
            
            y += 8;
            doc.setFontSize(14);
            doc.setTextColor(231, 76, 60);
            doc.text('TOTAL:', margin + 100, y);
            doc.text(`$${total.toFixed(2)}`, margin + 140, y);

            // Notas
            const notas = document.getElementById('notas').value;
            if (notas) {
                y += 15;
                doc.setFontSize(12);
                doc.setTextColor(44, 62, 80);
                doc.text('Notas:', margin, y);
                
                doc.setFontSize(9);
                doc.setTextColor(0, 0, 0);
                const lines = doc.splitTextToSize(notas, 150);
                y += 8;
                doc.text(lines, margin, y);
            }

            // Pie de página
            y = 270;
            doc.setFontSize(8);
            doc.setTextColor(127, 140, 141);
            doc.text('MadTech Solutions S.A.S', margin, y);
            doc.text('Tel: (555) 123-4567 | Email: info@madtech.com', margin, y + 5);
            doc.text('Dirección: Calle Tecnología 123, Ciudad Tech', margin, y + 10);
            doc.text('Esta cotización tiene una validez de 30 días', margin, y + 20);

            // Guardar PDF
            doc.save(`cotizacion_${this.numeroCotizacion}.pdf`);

            // Restaurar botón
            botonExportar.innerHTML = textoOriginal;
            botonExportar.disabled = false;

            alert('PDF generado exitosamente');

        } catch (error) {
            console.error('Error generando PDF:', error);
            alert('Error al generar el PDF. Por favor intente nuevamente.');
            
            // Restaurar botón
            const botonExportar = document.getElementById('exportar-pdf');
            botonExportar.innerHTML = '📄 Exportar a PDF';
            botonExportar.disabled = false;
        }
    }

    limpiarCotizacion() {
        if (confirm('¿Está seguro de limpiar toda la cotización?')) {
            // Limpiar datos del cliente
            document.getElementById('nombre-cliente').value = '';
            document.getElementById('email-cliente').value = '';
            document.getElementById('telefono-cliente').value = '';
            document.getElementById('direccion-cliente').value = '';
            document.getElementById('notas').value = '';
            document.getElementById('descuento-global').value = '0';
            
            // Limpiar productos
            this.productos = [];
            this.renderizarProductos();
            this.calcularTotales();
            
            // Generar nuevo número de cotización
            this.numeroCotizacion = this.generarNumeroCotizacion();
            document.getElementById('cotizacion-numero').textContent = this.numeroCotizacion;
            this.actualizarFecha();
            
            // Limpiar localStorage
            localStorage.removeItem('cotizacion_madtech');
            
            alert('Cotización limpiada correctamente');
        }
    }

    guardarCotizacion() {
        // Validar datos mínimos
        const nombreCliente = document.getElementById('nombre-cliente').value;
        if (!nombreCliente) {
            alert('Por favor ingrese el nombre del cliente antes de guardar');
            return;
        }
        
        if (this.productos.length === 0) {
            alert('Por favor agregue al menos un producto/servicio antes de guardar');
            return;
        }

        const cotizacion = {
            id: Date.now(),
            numero: this.numeroCotizacion,
            fecha: new Date().toISOString(),
            fechaFormateada: document.getElementById('fecha-actual').textContent,
            cliente: {
                nombre: document.getElementById('nombre-cliente').value,
                email: document.getElementById('email-cliente').value,
                telefono: document.getElementById('telefono-cliente').value,
                direccion: document.getElementById('direccion-cliente').value
            },
            productos: this.productos,
            descuentoGlobal: document.getElementById('descuento-global').value,
            notas: document.getElementById('notas').value,
            totales: {
                subtotal: document.getElementById('subtotal').textContent,
                subtotalDescuento: document.getElementById('subtotal-descuento').textContent,
                iva: document.getElementById('iva').textContent,
                total: document.getElementById('total-final').textContent
            }
        };
        
        // Guardar en localStorage
        let cotizaciones = JSON.parse(localStorage.getItem('cotizaciones_madtech') || '[]');
        cotizaciones.push(cotizacion);
        localStorage.setItem('cotizaciones_madtech', JSON.stringify(cotizaciones));
        
        // También guardar la cotización actual
        localStorage.setItem('cotizacion_madtech', JSON.stringify(cotizacion));
        
        alert('Cotización guardada exitosamente');
    }

    cargarCotizacionGuardada() {
        const cotizacionGuardada = localStorage.getItem('cotizacion_madtech');
        if (cotizacionGuardada) {
            try {
                const cotizacion = JSON.parse(cotizacionGuardada);
                
                // Cargar datos del cliente
                document.getElementById('nombre-cliente').value = cotizacion.cliente?.nombre || '';
                document.getElementById('email-cliente').value = cotizacion.cliente?.email || '';
                document.getElementById('telefono-cliente').value = cotizacion.cliente?.telefono || '';
                document.getElementById('direccion-cliente').value = cotizacion.cliente?.direccion || '';
                document.getElementById('notas').value = cotizacion.notas || '';
                document.getElementById('descuento-global').value = cotizacion.descuentoGlobal || '0';
                
                // Cargar productos
                this.productos = cotizacion.productos || [];
                this.renderizarProductos();
                this.calcularTotales();
                
                // Mantener el mismo número de cotización
                if (cotizacion.numero) {
                    this.numeroCotizacion = cotizacion.numero;
                    document.getElementById('cotizacion-numero').textContent = this.numeroCotizacion;
                }
                
            } catch (error) {
                console.error('Error cargando cotización guardada:', error);
                localStorage.removeItem('cotizacion_madtech');
            }
        }
    }

    verHistorial() {
        window.location.href = 'historial.html';
    }
}

// Inicializar el cotizador cuando se cargue la página
let cotizador;
document.addEventListener('DOMContentLoaded', () => {
    cotizador = new CotizadorMadTech();
});