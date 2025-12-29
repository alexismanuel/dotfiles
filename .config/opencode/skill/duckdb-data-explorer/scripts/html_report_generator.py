#!/usr/bin/env python3
"""
HTML Report Generator - Create interactive HTML reports for data exploration
"""

import json
import sys
import argparse
from datetime import datetime
from typing import Dict, Any

def generate_html_report(profile_data: Dict[str, Any], output_file: str) -> str:
    """
    Generate an HTML report from profile data
    """
    
    html_template = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Exploration Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #667eea;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 2em;
            font-weight: 600;
        }
        .summary-card p {
            margin: 0;
            color: #666;
            font-size: 0.9em;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .data-table th,
        .data-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .data-table th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #333;
        }
        .data-table tr:hover {
            background-color: #f8f9fa;
        }
        .null-bar {
            background-color: #e9ecef;
            border-radius: 4px;
            height: 20px;
            position: relative;
            overflow: hidden;
        }
        .null-fill {
            background-color: #dc3545;
            height: 100%;
            transition: width 0.3s ease;
        }
        .null-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 0.8em;
            font-weight: 600;
            color: #333;
        }
        .sample-data {
            max-height: 400px;
            overflow: auto;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .type-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: 600;
            background-color: #e9ecef;
            color: #495057;
        }
        .error {
            background-color: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Data Exploration Report</h1>
            <p>Generated on {timestamp}</p>
        </div>
        
        <div class="content">
            {content}
        </div>
    </div>
</body>
</html>
    """
    
    if "error" in profile_data:
        content = f'<div class="error"><h3>Error</h3><p>{profile_data["error"]}</p></div>'
    else:
        # Summary section
        summary_html = f"""
        <div class="summary-grid">
            <div class="summary-card">
                <h3>{profile_data.get('total_rows', 0):,}</h3>
                <p>Total Rows</p>
            </div>
            <div class="summary-card">
                <h3>{profile_data.get('total_columns', 0)}</h3>
                <p>Total Columns</p>
            </div>
            <div class="summary-card">
                <h3>{profile_data.get('file_type', 'Unknown').upper()}</h3>
                <p>File Type</p>
            </div>
        </div>
        """
        
        # Columns section
        columns_html = '<div class="section"><h2>Column Analysis</h2><table class="data-table">'
        columns_html += '<thead><tr><th>Column Name</th><th>Data Type</th><th>Total Count</th><th>Null Count</th><th>Null %</th><th>Unique Values</th></tr></thead><tbody>'
        
        for col in profile_data.get('columns', []):
            null_percentage = col.get('null_percentage', 0)
            columns_html += f"""
            <tr>
                <td><strong>{col.get('name', 'N/A')}</strong></td>
                <td><span class="type-badge">{col.get('type', 'N/A')}</span></td>
                <td>{col.get('total_count', 0):,}</td>
                <td>{col.get('null_count', 0):,}</td>
                <td>
                    <div class="null-bar">
                        <div class="null-fill" style="width: {null_percentage}%"></div>
                        <div class="null-text">{null_percentage}%</div>
                    </div>
                </td>
                <td>{col.get('unique_count', 0):,}</td>
            </tr>
            """
        
        columns_html += '</tbody></table></div>'
        
        # Sample data section
        sample_data = profile_data.get('sample_data', {})
        if sample_data.get('rows'):
            sample_html = '<div class="section"><h2>Sample Data (First 10 Rows)</h2>'
            sample_html += '<div class="sample-data"><table class="data-table">'
            
            # Header
            sample_html += '<thead><tr>'
            for col in sample_data.get('columns', []):
                sample_html += f'<th>{col}</th>'
            sample_html += '</tr></thead><tbody>'
            
            # Data rows
            for row in sample_data.get('rows', []):
                sample_html += '<tr>'
                for value in row:
                    sample_html += f'<td>{value if value is not None else "NULL"}</td>'
                sample_html += '</tr>'
            
            sample_html += '</tbody></table></div></div>'
        else:
            sample_html = ''
        
        content = summary_html + columns_html + sample_html
    
    html_content = html_template.format(
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        content=content
    )
    
    with open(output_file, 'w') as f:
        f.write(html_content)
    
    return output_file

def main():
    parser = argparse.ArgumentParser(description='Generate HTML report from profile data')
    parser.add_argument('profile_json', help='JSON file containing profile data')
    parser.add_argument('output_html', help='Output HTML file')
    
    args = parser.parse_args()
    
    try:
        with open(args.profile_json, 'r') as f:
            profile_data = json.load(f)
        
        output_file = generate_html_report(profile_data, args.output_html)
        print(f"HTML report generated: {output_file}")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()