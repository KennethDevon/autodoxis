const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePDF() {
  try {
    // Read the markdown file
    const markdownContent = fs.readFileSync('Autodoxis_Site_Map.md', 'utf8');
    
    // Convert markdown to HTML
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Autodoxis System Site Map</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: white;
            }
            
            h1 {
                color: #2c3e50;
                border-bottom: 3px solid #3498db;
                padding-bottom: 10px;
                margin-top: 30px;
                font-size: 28px;
            }
            
            h2 {
                color: #34495e;
                border-bottom: 2px solid #ecf0f1;
                padding-bottom: 8px;
                margin-top: 25px;
                font-size: 22px;
            }
            
            h3 {
                color: #2c3e50;
                margin-top: 20px;
                font-size: 18px;
            }
            
            h4 {
                color: #7f8c8d;
                margin-top: 15px;
                font-size: 16px;
            }
            
            p {
                margin: 10px 0;
                text-align: justify;
            }
            
            ul, ol {
                margin: 10px 0;
                padding-left: 30px;
            }
            
            li {
                margin: 5px 0;
            }
            
            code {
                background-color: #f8f9fa;
                padding: 2px 6px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                color: #e74c3c;
            }
            
            .role-section {
                background-color: #f8f9fa;
                padding: 15px;
                border-left: 4px solid #3498db;
                margin: 15px 0;
            }
            
            .endpoint-section {
                background-color: #e8f5e8;
                padding: 10px;
                border-radius: 5px;
                margin: 10px 0;
            }
            
            .feature-list {
                background-color: #fff3e0;
                padding: 10px;
                border-radius: 5px;
                margin: 10px 0;
            }
            
            .workflow-step {
                background-color: #f3e5f5;
                padding: 10px;
                border-radius: 5px;
                margin: 10px 0;
            }
            
            .page-break {
                page-break-before: always;
            }
            
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 10px;
            }
            
            .footer {
                text-align: center;
                margin-top: 30px;
                padding: 20px;
                background-color: #ecf0f1;
                border-radius: 10px;
                font-style: italic;
                color: #7f8c8d;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🏢 Autodoxis System Site Map</h1>
            <p><strong>Comprehensive Document Management & Routing System</strong></p>
            <p>Role-Based Access Control | Modern Web Technologies | Organizational Workflow Management</p>
        </div>
        
        ${markdownContent.replace(/# /g, '<h1>').replace(/## /g, '<h2>').replace(/### /g, '<h3>').replace(/#### /g, '<h4>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/`(.*?)`/g, '<code>$1</code>')
          .replace(/^- (.*$)/gm, '<li>$1</li>')
          .replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>')
          .replace(/\n\n/g, '</p><p>')
          .replace(/^(?!<[h|l])/gm, '<p>')
          .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
          .replace(/<ul><li>/g, '<ul><li>')
          .replace(/<\/li><\/ul>/g, '</li></ul>')}
        
        <div class="footer">
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>System Version:</strong> Autodoxis v1.0</p>
            <p><em>This document provides a comprehensive overview of the Autodoxis system architecture, features, and user workflows.</em></p>
        </div>
    </body>
    </html>
    `;
    
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set content and generate PDF
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      path: 'Autodoxis_Site_Map.pdf',
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #666;">Autodoxis System Site Map</div>',
      footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #666;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
    });
    
    await browser.close();
    
    console.log('PDF generated successfully: Autodoxis_Site_Map.pdf');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}

// Run the function
generatePDF();
