import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-reporte-peliculas',
  templateUrl: './reporte-peliculas.component.html',
  styleUrls: ['./reporte-peliculas.component.css']
})
export class ReportePeliculasComponent implements OnInit {
  peliculas: any[] = [];
  peliculasFiltradas: any[] = [];
  filtroGenero: string = '';
  filtroAnio: number | null = null;

  constructor(private http: HttpClient) {
    (<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
  }

  ngOnInit() {
    this.http.get<any[]>('./assets/peliculas.json').subscribe(data => {
      this.peliculas = data;
      this.aplicarFiltros();
    });
  }

  aplicarFiltros() {
    this.peliculasFiltradas = this.peliculas.filter(pelicula =>
      (!this.filtroGenero || pelicula.genero.toLowerCase().includes(this.filtroGenero.toLowerCase())) &&
      (!this.filtroAnio || pelicula.lanzamiento === this.filtroAnio)
    );
  }

  generarPDF() {
    const contenido = [
      { text: 'Informe de Películas', style: 'header' },
      { text: '\n\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            [
              { text: 'Título', style: 'tableHeader' },
              { text: 'Género', style: 'tableHeader' },
              { text: 'Año de lanzamiento', style: 'tableHeader' }
            ],
            ...this.peliculasFiltradas.map((pelicula, index) => [
              { text: pelicula.titulo, style: index % 2 === 0 ? 'tableBodyOdd' : 'tableBodyEven' },
              { text: pelicula.genero, style: index % 2 === 0 ? 'tableBodyOdd' : 'tableBodyEven' },
              { text: pelicula.lanzamiento.toString(), style: index % 2 === 0 ? 'tableBodyOdd' : 'tableBodyEven' }
            ])
          ]
        }
      }
    ];

    const estilos = {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10] as [number, number, number, number]
      },
      tableHeader: {
        fontSize: 14,
        bold: true,
        fillColor: '#D79BEF',
        color: 'white',
        alignment: 'center' as const,
        margin: [0, 5, 0, 5] as [number, number, number, number]
      },
      tableBodyOdd: {
        fontSize: 12,
        margin: [0, 5, 0, 5] as [number, number, number, number],
        fillColor: '#f9f9f9'
      },
      tableBodyEven: {
        fontSize: 12,
        margin: [0, 5, 0, 5] as [number, number, number, number]
      }
    };

    const documentDefinition = {
      content: contenido,
      styles: estilos,
    };

    pdfMake.createPdf(documentDefinition).open();
  }

  exportarExcel() {
    const datos = this.peliculasFiltradas.map(pelicula => ({
      Título: pelicula.titulo,
      Género: pelicula.genero,
      'Año de lanzamiento': pelicula.lanzamiento.toString()
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datos);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };

    XLSX.writeFile(workbook, 'reporte-peliculas.xlsx');
  }

  exportarCSV() {
    const datos = this.peliculasFiltradas.map(pelicula => [
      pelicula.titulo,
      pelicula.genero,
      pelicula.lanzamiento.toString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + datos.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'reporte-peliculas.csv');
    document.body.appendChild(link); // Required for Firefox
    link.click();
  }
}
