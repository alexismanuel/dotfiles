#!/usr/bin/env python3
"""
DuckDB Data Profiler - Automated data quality analysis and profiling
"""

import duckdb
import json
import sys
from typing import Dict, Any, List
import argparse

def profile_data(file_path: str, file_type: str = "auto") -> Dict[str, Any]:
    """
    Profile a data file and return comprehensive data quality metrics
    """
    conn = duckdb.connect(':memory:')
    
    try:
        # Auto-detect file type or use specified type
        if file_type == "auto":
            if file_path.endswith('.csv'):
                file_type = "csv"
            elif file_path.endswith('.parquet'):
                file_type = "parquet"
            elif file_path.endswith('.json'):
                file_type = "json"
            else:
                raise ValueError(f"Cannot auto-detect file type for {file_path}")
        
        # Create table from file
        if file_type == "csv":
            conn.execute(f"CREATE TABLE data AS SELECT * FROM read_csv_auto('{file_path}')")
        elif file_type == "parquet":
            conn.execute(f"CREATE TABLE data AS SELECT * FROM read_parquet('{file_path}')")
        elif file_type == "json":
            conn.execute(f"CREATE TABLE data AS SELECT * FROM read_json_auto('{file_path}')")
        
        # Get basic info
        count_result = conn.execute("SELECT COUNT(*) FROM data").fetchone()
        total_rows = count_result[0] if count_result else 0
        
        # Get column info
        columns_result = conn.execute("""
            SELECT 
                column_name,
                data_type,
                COUNT(*) as total_count,
                COUNT(CASE WHEN column_value IS NULL THEN 1 END) as null_count,
                ROUND(COUNT(CASE WHEN column_value IS NULL THEN 1 END) * 100.0 / COUNT(*), 2) as null_percentage,
                COUNT(DISTINCT column_value) as unique_count
            FROM (
                UNPIVOT data ON COLUMNS EXCLUDE () INTO 
                NAME column_name VALUE column_value
            )
            GROUP BY column_name, data_type
            ORDER BY column_name
        """)
        columns_info = columns_result.fetchall()
        
        # Get sample data
        sample_result = conn.execute("SELECT * FROM data LIMIT 10")
        sample_data = sample_result.fetchall()
        column_names = [desc[0] for desc in sample_result.description] if sample_result.description else []
        
        # Get data type distribution
        type_result = conn.execute("""
            SELECT data_type, COUNT(*) as column_count
            FROM information_schema.columns
            WHERE table_name = 'data'
            GROUP BY data_type
        """)
        type_distribution = type_result.fetchall() if type_result else []
        
        return {
            "file_path": file_path,
            "file_type": file_type,
            "total_rows": total_rows,
            "total_columns": len(columns_info),
            "columns": [
                {
                    "name": col[0],
                    "type": col[1],
                    "total_count": col[2],
                    "null_count": col[3],
                    "null_percentage": col[4],
                    "unique_count": col[5]
                }
                for col in columns_info
            ],
            "sample_data": {
                "columns": column_names,
                "rows": sample_data
            },
            "type_distribution": [
                {"type": row[0], "count": row[1]} 
                for row in type_distribution
            ]
        }
        
    except Exception as e:
        return {"error": str(e)}
    finally:
        conn.close()

def main():
    parser = argparse.ArgumentParser(description='Profile data files using DuckDB')
    parser.add_argument('file_path', help='Path to the data file')
    parser.add_argument('--type', choices=['csv', 'parquet', 'json', 'auto'], 
                       default='auto', help='File type (default: auto-detect)')
    parser.add_argument('--output', help='Output JSON file (default: stdout)')
    
    args = parser.parse_args()
    
    profile = profile_data(args.file_path, args.type)
    
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(profile, f, indent=2, default=str)
        print(f"Profile saved to {args.output}")
    else:
        print(json.dumps(profile, indent=2, default=str))

if __name__ == "__main__":
    main()