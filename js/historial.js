class HistorialCotizaciones {
    constructor() {
        this.cotizaciones = [];
        this.cotizacionesFiltradas = [];
        this.cargarCotizaciones();
        this.inicializarEventos();
        this.mostrarCotizaciones();
    }

    cargarCotizaciones() {
        this.cotizaciones = JSON.parse(localStorage.getItem('cotizaciones_madtech') || '[]');
        this.cotizacionesFiltradas = [...this.cotizaciones];
        document.getElementById('total-cotizaciones').textContent = this.cotizaciones.length;
    }

    inicializarEventos() {
        // Filtros
        document.getElementById('buscar-cliente').addEventListener('input', () => 
            this.filtrarCotizaciones());
        
        document.getElementById('fecha-desde').addEventListener('change', () => 
            this.filtrarCotizaciones());
        
        document.getElementById('fecha-hasta').addEventListener('change', () => 
            this.filtrarCotizaciones());
        
        document.getElementById('ordenar-por').addEventListener('change', () => 
            this.filtrarCotizaciones());
        
        // Botones
        document.getElementById('limpiar-filtros').addEventListener('click', () => 
            this.limpiarFiltros());
        
        document.getElementById('volver-cotizador').addEventListener('click', () => 
            this.volverCotizador());
        
        document.getElementById('exportar-historial').addEventListener('click', () => 
            this.exportarHistorial());
    }

    filtrarCotizaciones() {
        const cliente = document.getElementById('buscar-cliente').value.toLowerCase();
        const fechaDesde = document.getElementById('fecha-desde').value;
        const fechaHasta = document.getElementById('fecha-hasta').value;
        const orden = document.getElementById('ordenar-por').value;

        this.cotizacionesFiltradas = this.cotizaciones.filter(cotizacion => {
            // Filtro por cliente
            if (cliente && !cotizacion.cliente.nombre.toLowerCase().includes(cliente)) {
                return false;
            }

            // Filtro por fecha desde
            if (fechaDesde) {
                const fechaCotizacion = new Date(cotizacion.fecha);
                const fechaDesdeObj = new Date(fechaDesde);
                if (fechaCotizacion < fechaDesdeObj) {
                    return false;
                }
            }

            // Filtro por fecha hasta
            if (fechaHasta) {
                const fechaCotizacion = new Date(cotizacion.fecha);
                const fechaHastaObj = new Date(fechaHasta);
                fechaHastaObj.setHours(23, 59, 59, 999); // Incluir todo el día
                if (fechaCotizacion > fechaHastaObj) {
                    return false;
                }
            }

            return true;
        });

        // Ordenar
        this.ordenarCotizaciones(orden);
        this.mostrarCotizaciones();
    }

    ordenarCotizaciones(criterio) {
        switch (criterio) {
            case 'fecha-desc':
                this.cotizacionesFiltradas.sort((a, b) => 
                    new Date(b.fecha) - new Date(a.fecha));
                break;
            case 'fecha-asc':
                this.cotizacionesFiltradas.sort((a, b) => 
                    new Date(a.fecha) - new Date(b.fecha));
                break;
            case 'monto-desc':
                this.cotizacionesFiltradas.sort((a, b) => {
                    const totalA = parseFloat(a.totales.total.replace(/[^0-9.-]+/g,"")) || 0;
                    const totalB = parseFloat(b.totales.total.replace(/[^0-9.-]+/g,"")) || 0;
                    return totalB - totalA;
                });
                break;
            case 'monto-asc':
                this.cotizacionesFiltradas.sort((a, b) => {
                    const totalA = parseFloat(a.totales.total.replace(/[^0-9.-]+/g,"")) || 0;
                    const totalB = parseFloat(b.totales.total.replace(/[^0-9.-]+/g,"")) || 0;
                    return totalA - totalB;
                });
                break;
        }
    }

    mostrarCotizaciones() {
        const tbody = document.querySelector('#historial-table tbody');
        tbody.innerHTML = '';

        if (this.cotizacionesFiltradas.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="5" style="text-align: center; padding: 30px;">
                    No se encontraron cotizaciones
                </td>
            `;
            tbody.appendChild(row);
            return;
        }

        this.cotizacionesFiltradas.forEach(cotizacion => {
            const total = cotizacion.totales.total.replace('<strong>', '').replace('</strong>', '');
            const fecha = new Date(cotizacion.fecha);
            const fechaFormateada = fecha.toLocaleDateString('es-ES');
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${cotizacion.numero}</td>
                <td>${cotizacion.cliente.nombre}</td>
                <td>${fechaFormateada}</td>
                <td>${total}</td>
                <td>
                    <button class="btn-secundario" onclick="historial.verCotizacion(${cotizacion.id})" style="padding: 5px 10px; font-size: 0.8rem;">
                        Ver
                    </button>
                    <button class="btn-eliminar" onclick="historial.eliminarCotizacion(${cotizacion.id})" style="padding: 5px 10px; font-size: 0.8rem;">
                        Eliminar
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    verCotizacion(id) {
        // Guardar la cotización seleccionada en localStorage
        const cotizacion = this.cotizaciones.find(c => c.id === id);
        if (cotizacion) {
            localStorage.setItem('cotizacion_madtech', JSON.stringify(cotizacion));
            window.location.href = 'index.html';
        }
    }

    eliminarCotizacion(id) {
        if (confirm('¿Está seguro de eliminar esta cotización?')) {
            this.cotizaciones = this.cotizaciones.filter(c => c.id !== id);
            localStorage.setItem('cotizaciones_madtech', JSON.stringify(this.cotizaciones));
            this.cargarCotizaciones();
            this.filtrarCotizaciones();
            alert('Cotización eliminada correctamente');
        }
    }

    limpiarFiltros() {
        document.getElementById('buscar-cliente').value = '';
        document.getElementById('fecha-desde').value = '';
        document.getElementById('fecha-hasta').value = '';
        document.getElementById('ordenar-por').value = 'fecha-desc';
        this.cotizacionesFiltradas = [...this.cotizaciones];
        this.mostrarCotizaciones();
    }

    volverCotizador() {
        window.location.href = 'index.html';
    }

    exportarHistorial() {
        if (this.cotizacionesFiltradas.length === 0) {
            alert('No hay cotizaciones para exportar');
            return;
        }

        try {
            let csv = 'Número Cotización,Cliente,Fecha,Total\n';
            
            this.cotizacionesFiltradas.forEach(cotizacion => {
                const total = cotizacion.totales.total.replace(/[^0-9.,$]+/g, '');
                const fecha = new Date(cotizacion.fecha);
                const fechaFormateada = fecha.toLocaleDateString('es-ES');
                
                csv += `"${cotizacion.numero}","${cotizacion.cliente.nombre}","${fechaFormateada}","${total}"\n`;
            });

            // Crear y descargar archivo CSV
            const blob = new Blob(['\ufeff' + csv], { 
                type: 'text/csv;charset=utf-8;' 
            });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `historial_cotizaciones_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            alert('Historial exportado exitosamente');

        } catch (error) {
            console.error('Error exportando historial:', error);
            alert('Error al exportar el historial');
        }
    }
}

// Inicializar el historial cuando se cargue la página
let historial;
document.addEventListener('DOMContentLoaded', () => {
    historial = new HistorialCotizaciones();
});