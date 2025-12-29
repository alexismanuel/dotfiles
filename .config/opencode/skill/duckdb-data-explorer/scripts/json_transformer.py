#!/usr/bin/env python3
"""
DuckDB JSON Transformer - Complex JSON handling and transformation utilities
"""

import duckdb
import json
import sys
import argparse
from typing import Dict, Any, List

def transform_json_data(input_pattern: str, query: str, output_file: str | None = None) -> Dict[str, Any]:
    """
    Transform JSON data using DuckDB with complex JSON functions
    """
    conn = duckdb.connect(':memory:')
    
    try:
        # Create table from JSON files (supports glob patterns)
        conn.execute(f"CREATE TABLE json_data AS SELECT * FROM read_json_auto('{input_pattern}')")
        
        # Execute the transformation query
        query_result = conn.execute(query)
        result = query_result.fetchall()
        column_names = [desc[0] for desc in query_result.description] if query_result.description else []
        
        # Convert to list of dicts
        transformed_data = [
            dict(zip(column_names, row)) for row in result
        ]
        
        output = {
            "input_pattern": input_pattern,
            "query": query,
            "result_count": len(transformed_data),
            "columns": column_names,
            "data": transformed_data
        }
        
        # Save to output file if specified
        if output_file:
            if output_file.endswith('.parquet'):
                # Create a new table and export to parquet
                conn.execute("CREATE TABLE transformed_data AS " + query.replace("SELECT", "SELECT").split("FROM")[0])
                conn.execute(f"COPY transformed_data TO '{output_file}' (FORMAT PARQUET)")
                output["output_file"] = output_file
            elif output_file.endswith('.json'):
                with open(output_file, 'w') as f:
                    json.dump(output, f, indent=2, default=str)
                output["output_file"] = output_file
        
        return output
        
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()

def get_json_structure(file_path: str) -> Dict[str, Any]:
    """
    Analyze JSON structure to understand nested fields
    """
    conn = duckdb.connect(':memory:')
    
    try:
        conn.execute(f"CREATE TABLE json_data AS SELECT * FROM read_json_auto('{file_path}')")
        
        # Get column structure
        structure_result = conn.execute("""
            SELECT 
                column_name,
                data_type,
                CASE 
                    WHEN data_type LIKE '%JSON%' THEN 'nested'
                    WHEN data_type LIKE '%STRUCT%' THEN 'nested'
                    WHEN data_type LIKE '%LIST%' THEN 'array'
                    ELSE 'primitive'
                END as field_type
            FROM information_schema.columns 
            WHERE table_name = 'json_data'
            ORDER BY column_name
        """)
        structure = structure_result.fetchall()
        
        # Sample data to understand structure better
        sample_result = conn.execute("SELECT * FROM json_data LIMIT 3")
        sample = sample_result.fetchall()
        column_names = [desc[0] for desc in sample_result.description] if sample_result.description else []
        
        return {
            "file_path": file_path,
            "structure": [
                {
                    "name": col[0],
                    "type": col[1],
                    "field_type": col[2]
                }
                for col in structure
            ],
            "sample_data": {
                "columns": column_names,
                "rows": sample
            }
        }
        
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()

def main():
    parser = argparse.ArgumentParser(description='Transform JSON data using DuckDB')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Transform command
    transform_parser = subparsers.add_parser('transform', help='Transform JSON data')
    transform_parser.add_argument('input_pattern', help='Input JSON file pattern (supports glob)')
    transform_parser.add_argument('query', help='SQL query for transformation')
    transform_parser.add_argument('--output', help='Output file (parquet or json)')
    
    # Structure command
    structure_parser = subparsers.add_parser('structure', help='Analyze JSON structure')
    structure_parser.add_argument('file_path', help='JSON file to analyze')
    
    args = parser.parse_args()
    
    if args.command == 'transform':
        result = transform_json_data(args.input_pattern, args.query, args.output)
        print(json.dumps(result, indent=2, default=str))
    elif args.command == 'structure':
        result = get_json_structure(args.file_path)
        print(json.dumps(result, indent=2, default=str))
    else:
        parser.print_help()

if __name__ == "__main__":
    main()