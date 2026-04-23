'use client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function RiskReports() {
  const [exporting, setExporting] = useState(''); // 'pdf' | 'excel' | ''

  async function fetchReportData() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch('http://localhost:3000/api/risks', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error(`Failed to fetch risks: ${res.status}`);
    return res.json();
  }

  const exportToPDF = async () => {
    try {
      setExporting('pdf');
      const data = await fetchReportData();

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header
      doc.setFontSize(18);
      doc.setTextColor(30, 58, 138); // blue-900
      doc.text('FortiGRC Risk Report', 14, 15);

      // Bottom right timestamp
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, pageHeight - 10, { align: 'right' });

      autoTable(doc, {
        startY: 20,
        head: [['Title', 'Capability', 'Likelihood', 'Impact', 'Score', 'Severity']],
        body: data.map(r => [
          r.title || 'N/A',
          r.jncsf_capability || 'N/A',
          r.likelihood || '-',
          r.impact || '-',
          r.quantitative_score || '-',
          r.severity_level || 'N/A'
        ]),
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 255] },
        styles: { fontSize: 9, cellPadding: 4 },
      });

      const img = new Image();
      img.src = '/logo.png'; // Ensure this matches the file in the public folder
      img.onload = () => {
        // Add image at top right (x, y, width, height). Adjust dimensions as needed.
        doc.addImage(img, 'PNG', pageWidth - 45, 10, 30, 10);
        
        // Save the document ONLY after the image has loaded
        doc.save('FortiGRC_Risk_Report.pdf');
        setExporting(''); // Reset after save
      };
      
      // Fallback in case the image fails to load so the app doesn't freeze
      img.onerror = () => {
        console.error('Failed to load logo for PDF');
        doc.save('FortiGRC_Risk_Report.pdf'); 
        setExporting(''); // Reset after save
      };
    } catch (err) {
      console.error('PDF export error:', err);
      alert(`Export failed: ${err.message}`);
      setExporting('');
    }
  };

  const exportToExcel = async () => {
    try {
      setExporting('excel');
      const data = await fetchReportData();

      const excelData = data.map(risk => ({
        'Risk Title': risk.title || 'N/A',
        'JNCF Capability': risk.jncsf_capability || 'N/A',
        'Likelihood (1-5)': risk.likelihood || '-',
        'Impact (1-5)': risk.impact || '-',
        'Quantitative Score': risk.quantitative_score || '-',
        'Severity Level': risk.severity_level || 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Risks');
      XLSX.writeFile(workbook, 'FortiGRC_Risk_Report.xlsx');
    } catch (err) {
      console.error('Excel export error:', err);
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Risk Reports</h2>
        <p className="text-gray-500 text-sm">Generate and export risk analysis reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Summary Report Card */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mr-3">
              <i className="fa-solid fa-chart-bar text-blue-600"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Summary Report</h3>
              <p className="text-xs text-gray-400">Risk overview with severity distribution</p>
            </div>
          </div>
          <p className="text-gray-500 text-sm mb-6">
            Overview of all risks with statistics, capability breakdowns, and severity trends.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={exportToPDF}
              disabled={exporting === 'pdf'}
              className="inline-flex items-center px-4 py-2 border border-red-200 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {exporting === 'pdf' ? (
                <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Generating…</>
              ) : (
                <><i className="fa-regular fa-file-pdf mr-2"></i> PDF</>
              )}
            </button>
            <button
              onClick={exportToExcel}
              disabled={exporting === 'excel'}
              className="inline-flex items-center px-4 py-2 border border-green-200 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {exporting === 'excel' ? (
                <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Generating…</>
              ) : (
                <><i className="fa-regular fa-file-excel mr-2"></i> Excel</>
              )}
            </button>
          </div>
        </div>

        {/* Detailed Report Card */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center mr-3">
              <i className="fa-solid fa-chart-pie text-purple-600"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Detailed Report</h3>
              <p className="text-xs text-gray-400">Complete registry with all fields</p>
            </div>
          </div>
          <p className="text-gray-500 text-sm mb-6">
            Complete risk registry export including all metadata, scores, and mitigation data.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={exportToPDF}
              disabled={exporting === 'pdf'}
              className="inline-flex items-center px-4 py-2 border border-red-200 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {exporting === 'pdf' ? (
                <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Generating…</>
              ) : (
                <><i className="fa-regular fa-file-pdf mr-2"></i> PDF</>
              )}
            </button>
            <button
              onClick={exportToExcel}
              disabled={exporting === 'excel'}
              className="inline-flex items-center px-4 py-2 border border-green-200 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {exporting === 'excel' ? (
                <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Generating…</>
              ) : (
                <><i className="fa-regular fa-file-excel mr-2"></i> Excel</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
