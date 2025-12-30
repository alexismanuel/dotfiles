#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "tree-sitter==0.21.3",
#     "tree-sitter-languages>=1.10.0",
#     "gitignore-parser>=0.1.0",
# ]
# ///
"""
Codemap Generator - Generate hierarchical code maps for AI agents.

Analyzes codebases using tree-sitter to extract:
- File/module structure and imports
- Classes, functions, and their relationships
- Call graphs and inheritance hierarchies

Output: Markdown format optimized for AI consumption.

Usage:
    uv run codemap.py [directory] [options]
"""

import argparse
import os
import re
import sys
import warnings
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

# Suppress tree-sitter deprecation warnings
warnings.filterwarnings('ignore', category=FutureWarning, module='tree_sitter')

try:
    import tree_sitter_languages as tsl
except ImportError:
    print("Error: tree-sitter-languages not installed.")
    print("Run: uv pip install tree-sitter==0.21.3 tree-sitter-languages gitignore-parser")
    sys.exit(1)

try:
    from gitignore_parser import parse_gitignore
except ImportError:
    parse_gitignore = None


# =============================================================================
# Configuration
# =============================================================================

@dataclass
class Config:
    """Configuration for codemap generation."""
    root_dir: Path = field(default_factory=Path.cwd)
    granularity: str = "detailed"  # "file" or "detailed"
    max_depth: int = 10
    include_private: bool = False
    include_docstrings: bool = True
    include_signatures: bool = True
    output_file: Optional[Path] = None
    exclude_patterns: list = field(default_factory=lambda: [
        "__pycache__", "node_modules", ".git", ".svn", ".hg",
        "venv", ".venv", "env", ".env", "dist", "build",
        ".idea", ".vscode", "*.pyc", "*.pyo", "*.so", "*.dll",
        ".tox", ".pytest_cache", ".mypy_cache", "*.egg-info",
        "vendor", "target", "bin", "obj"
    ])


# =============================================================================
# Language Support
# =============================================================================

LANGUAGE_MAP = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "tsx",
    ".go": "go",
    ".rs": "rust",
    ".java": "java",
    ".c": "c",
    ".h": "c",
    ".cpp": "cpp",
    ".cc": "cpp",
    ".cxx": "cpp",
    ".hpp": "cpp",
    ".cs": "c_sharp",
    ".rb": "ruby",
    ".php": "php",
    ".swift": "swift",
    ".kt": "kotlin",
    ".kts": "kotlin",
    ".scala": "scala",
    ".lua": "lua",
    ".zig": "zig",
    ".ex": "elixir",
    ".exs": "elixir",
    ".erl": "erlang",
    ".hrl": "erlang",
    ".hs": "haskell",
    ".ml": "ocaml",
    ".mli": "ocaml",
    ".r": "r",
    ".R": "r",
    ".jl": "julia",
    ".sh": "bash",
    ".bash": "bash",
    ".zsh": "bash",
    ".fish": "fish",
    ".sql": "sql",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".toml": "toml",
    ".json": "json",
    ".html": "html",
    ".htm": "html",
    ".css": "css",
    ".scss": "scss",
    ".vue": "vue",
    ".svelte": "svelte",
}

# Queries for extracting code elements (language -> query type -> query string)
QUERIES = {
    "python": {
        "imports": """
            (import_statement) @import
            (import_from_statement) @import
        """,
        "classes": """
            (class_definition
                name: (identifier) @class.name
                superclasses: (argument_list)? @class.bases
                body: (block) @class.body
            ) @class
        """,
        "functions": """
            (function_definition
                name: (identifier) @function.name
                parameters: (parameters) @function.params
                return_type: (type)? @function.return_type
                body: (block) @function.body
            ) @function
        """,
        "calls": """
            (call
                function: [
                    (identifier) @call.name
                    (attribute attribute: (identifier) @call.name)
                ]
            ) @call
        """,
    },
    "javascript": {
        "imports": """
            (import_statement) @import
            (import_clause) @import
        """,
        "classes": """
            (class_declaration
                name: (identifier) @class.name
                (class_heritage)? @class.bases
                body: (class_body) @class.body
            ) @class
        """,
        "functions": """
            (function_declaration
                name: (identifier) @function.name
                parameters: (formal_parameters) @function.params
                body: (statement_block) @function.body
            ) @function
            (arrow_function
                parameters: [(formal_parameters) (identifier)] @function.params
                body: [(statement_block) (_)] @function.body
            ) @function
            (method_definition
                name: (property_identifier) @function.name
                parameters: (formal_parameters) @function.params
                body: (statement_block) @function.body
            ) @function
        """,
        "calls": """
            (call_expression
                function: [
                    (identifier) @call.name
                    (member_expression property: (property_identifier) @call.name)
                ]
            ) @call
        """,
    },
    "typescript": {
        "imports": """
            (import_statement) @import
        """,
        "classes": """
            (class_declaration
                name: (type_identifier) @class.name
                (class_heritage)? @class.bases
                body: (class_body) @class.body
            ) @class
        """,
        "functions": """
            (function_declaration
                name: (identifier) @function.name
                parameters: (formal_parameters) @function.params
                return_type: (type_annotation)? @function.return_type
                body: (statement_block) @function.body
            ) @function
            (arrow_function
                parameters: [(formal_parameters) (identifier)] @function.params
                return_type: (type_annotation)? @function.return_type
                body: [(statement_block) (_)] @function.body
            ) @function
            (method_definition
                name: (property_identifier) @function.name
                parameters: (formal_parameters) @function.params
                return_type: (type_annotation)? @function.return_type
                body: (statement_block) @function.body
            ) @function
        """,
        "calls": """
            (call_expression
                function: [
                    (identifier) @call.name
                    (member_expression property: (property_identifier) @call.name)
                ]
            ) @call
        """,
    },
    "go": {
        "imports": """
            (import_declaration) @import
            (import_spec) @import
        """,
        "classes": """
            (type_declaration
                (type_spec
                    name: (type_identifier) @class.name
                    type: (struct_type) @class.body
                )
            ) @class
        """,
        "functions": """
            (function_declaration
                name: (identifier) @function.name
                parameters: (parameter_list) @function.params
                result: [(parameter_list) (type_identifier)]? @function.return_type
                body: (block) @function.body
            ) @function
            (method_declaration
                receiver: (parameter_list) @function.receiver
                name: (field_identifier) @function.name
                parameters: (parameter_list) @function.params
                result: [(parameter_list) (type_identifier)]? @function.return_type
                body: (block) @function.body
            ) @function
        """,
        "calls": """
            (call_expression
                function: [
                    (identifier) @call.name
                    (selector_expression field: (field_identifier) @call.name)
                ]
            ) @call
        """,
    },
    "rust": {
        "imports": """
            (use_declaration) @import
        """,
        "classes": """
            (struct_item
                name: (type_identifier) @class.name
                body: [(field_declaration_list) (ordered_field_declaration_list)]? @class.body
            ) @class
            (impl_item
                trait: (type_identifier)? @class.trait
                type: (type_identifier) @class.name
                body: (declaration_list) @class.body
            ) @class
            (trait_item
                name: (type_identifier) @class.name
                body: (declaration_list) @class.body
            ) @class
        """,
        "functions": """
            (function_item
                name: (identifier) @function.name
                parameters: (parameters) @function.params
                return_type: (type)? @function.return_type
                body: (block) @function.body
            ) @function
        """,
        "calls": """
            (call_expression
                function: [
                    (identifier) @call.name
                    (field_expression field: (field_identifier) @call.name)
                    (scoped_identifier name: (identifier) @call.name)
                ]
            ) @call
        """,
    },
    "java": {
        "imports": """
            (import_declaration) @import
        """,
        "classes": """
            (class_declaration
                name: (identifier) @class.name
                superclass: (superclass)? @class.bases
                interfaces: (super_interfaces)? @class.interfaces
                body: (class_body) @class.body
            ) @class
            (interface_declaration
                name: (identifier) @class.name
                (extends_interfaces)? @class.bases
                body: (interface_body) @class.body
            ) @class
        """,
        "functions": """
            (method_declaration
                type: (_) @function.return_type
                name: (identifier) @function.name
                parameters: (formal_parameters) @function.params
                body: (block)? @function.body
            ) @function
            (constructor_declaration
                name: (identifier) @function.name
                parameters: (formal_parameters) @function.params
                body: (constructor_body) @function.body
            ) @function
        """,
        "calls": """
            (method_invocation
                name: (identifier) @call.name
            ) @call
        """,
    },
    "c": {
        "imports": """
            (preproc_include) @import
        """,
        "classes": """
            (struct_specifier
                name: (type_identifier) @class.name
                body: (field_declaration_list) @class.body
            ) @class
            (type_definition
                type: (struct_specifier) @class.type
                declarator: (type_identifier) @class.name
            ) @class
        """,
        "functions": """
            (function_definition
                type: (_) @function.return_type
                declarator: (function_declarator
                    declarator: (identifier) @function.name
                    parameters: (parameter_list) @function.params
                )
                body: (compound_statement) @function.body
            ) @function
        """,
        "calls": """
            (call_expression
                function: (identifier) @call.name
            ) @call
        """,
    },
    "ruby": {
        "imports": """
            (call
                method: [(identifier) @_method]
                arguments: (argument_list) @import
                (#match? @_method "^(require|require_relative|load)$")
            ) @import
        """,
        "classes": """
            (class
                name: [(constant) (scope_resolution)] @class.name
                superclass: (superclass)? @class.bases
            ) @class
            (module
                name: [(constant) (scope_resolution)] @class.name
            ) @class
        """,
        "functions": """
            (method
                name: [(identifier) (operator)] @function.name
                parameters: (method_parameters)? @function.params
            ) @function
            (singleton_method
                object: (_) @function.receiver
                name: [(identifier) (operator)] @function.name
                parameters: (method_parameters)? @function.params
            ) @function
        """,
        "calls": """
            (call
                method: (identifier) @call.name
            ) @call
        """,
    },
}

# Default fallback queries for unsupported languages
DEFAULT_QUERIES = {
    "imports": "(import_statement) @import",
    "classes": "(class_declaration name: (identifier) @class.name) @class",
    "functions": "(function_definition name: (identifier) @function.name) @function",
    "calls": "(call_expression function: (identifier) @call.name) @call",
}


# =============================================================================
# Data Structures
# =============================================================================

@dataclass
class Import:
    """Represents an import statement."""
    raw: str
    module: str
    names: list[str] = field(default_factory=list)
    line: int = 0


@dataclass
class Function:
    """Represents a function or method."""
    name: str
    params: str = ""
    return_type: str = ""
    docstring: str = ""
    line: int = 0
    end_line: int = 0
    calls: list[str] = field(default_factory=list)
    is_method: bool = False
    is_private: bool = False


@dataclass
class Class:
    """Represents a class or struct."""
    name: str
    bases: list[str] = field(default_factory=list)
    docstring: str = ""
    line: int = 0
    end_line: int = 0
    methods: list[Function] = field(default_factory=list)
    is_private: bool = False


@dataclass
class FileInfo:
    """Represents a parsed source file."""
    path: Path
    relative_path: Path
    language: str
    imports: list[Import] = field(default_factory=list)
    classes: list[Class] = field(default_factory=list)
    functions: list[Function] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


# =============================================================================
# File Discovery
# =============================================================================

def should_ignore(path: Path, config: Config, gitignore_matcher=None) -> bool:
    """Check if a path should be ignored."""
    name = path.name

    # Check exclude patterns
    for pattern in config.exclude_patterns:
        if pattern.startswith("*"):
            if name.endswith(pattern[1:]):
                return True
        elif name == pattern or pattern in str(path):
            return True

    # Check gitignore
    if gitignore_matcher and gitignore_matcher(str(path)):
        return True

    return False


def discover_files(config: Config) -> list[Path]:
    """Discover all source files in the repository."""
    files = []
    gitignore_matcher = None

    # Try to parse .gitignore
    gitignore_path = config.root_dir / ".gitignore"
    if parse_gitignore and gitignore_path.exists():
        try:
            gitignore_matcher = parse_gitignore(gitignore_path)
        except Exception:
            pass

    for root, dirs, filenames in os.walk(config.root_dir):
        root_path = Path(root)
        depth = len(root_path.relative_to(config.root_dir).parts)

        if depth > config.max_depth:
            dirs.clear()
            continue

        # Filter directories
        dirs[:] = [
            d for d in dirs
            if not d.startswith(".") and not should_ignore(root_path / d, config, gitignore_matcher)
        ]

        for filename in filenames:
            file_path = root_path / filename
            ext = file_path.suffix.lower()

            if ext in LANGUAGE_MAP and not should_ignore(file_path, config, gitignore_matcher):
                files.append(file_path)

    return sorted(files)


# =============================================================================
# Parsing
# =============================================================================

def get_parser(language: str):
    """Get tree-sitter parser for a language."""
    try:
        return tsl.get_parser(language)
    except Exception:
        return None


def get_language(language: str):
    """Get tree-sitter language for queries."""
    try:
        return tsl.get_language(language)
    except Exception:
        return None


def extract_text(node, source: bytes) -> str:
    """Extract text from a tree-sitter node."""
    return source[node.start_byte:node.end_byte].decode("utf-8", errors="replace")


def extract_docstring(node, source: bytes, language: str) -> str:
    """Extract docstring from a function or class."""
    if not node.children:
        return ""

    for child in node.children:
        if language == "python":
            # Look for expression_statement containing string
            if child.type == "block":
                for stmt in child.children:
                    if stmt.type == "expression_statement":
                        for expr in stmt.children:
                            if expr.type == "string":
                                doc = extract_text(expr, source)
                                # Clean up docstring
                                doc = doc.strip("\"'").strip()
                                if len(doc) > 200:
                                    doc = doc[:200] + "..."
                                return doc
                        break
        elif language in ("javascript", "typescript", "java", "c", "cpp"):
            # Look for preceding comment
            if child.type == "comment":
                return extract_text(child, source).strip("/* \n\t")

    return ""


def parse_imports(source: bytes, tree, language: str) -> list[Import]:
    """Parse import statements from source."""
    imports = []
    lang = get_language(language)
    if not lang:
        return imports

    queries = QUERIES.get(language, DEFAULT_QUERIES)
    query_str = queries.get("imports", "")
    if not query_str:
        return imports

    try:
        query = lang.query(query_str)
        captures = query.captures(tree.root_node)
    except Exception:
        return imports

    seen = set()
    for node, name in captures:
        raw = extract_text(node, source).strip()
        if raw in seen:
            continue
        seen.add(raw)

        # Parse module name from import
        module = ""
        names = []

        if language == "python":
            # Handle "import x" and "from x import y"
            match = re.match(r"(?:from\s+(\S+)\s+)?import\s+(.+)", raw)
            if match:
                module = match.group(1) or match.group(2).split(",")[0].split()[0]
                if match.group(1):
                    names = [n.strip().split()[0] for n in match.group(2).split(",")]
        elif language in ("javascript", "typescript", "tsx"):
            # Handle various import styles
            match = re.search(r"from\s+['\"]([^'\"]+)['\"]", raw)
            if match:
                module = match.group(1)
        elif language == "go":
            match = re.search(r'"([^"]+)"', raw)
            if match:
                module = match.group(1)
        elif language == "rust":
            match = re.search(r"use\s+([^;{]+)", raw)
            if match:
                module = match.group(1).strip()
        elif language == "java":
            match = re.search(r"import\s+(?:static\s+)?([^;]+)", raw)
            if match:
                module = match.group(1).strip()
        elif language == "c" or language == "cpp":
            match = re.search(r'[<"]([^>"]+)[>"]', raw)
            if match:
                module = match.group(1)
        else:
            module = raw

        imports.append(Import(
            raw=raw,
            module=module,
            names=names,
            line=node.start_point[0] + 1
        ))

    return imports


def parse_classes(source: bytes, tree, language: str, config: Config) -> list[Class]:
    """Parse class definitions from source."""
    classes = []
    lang = get_language(language)
    if not lang:
        return classes

    queries = QUERIES.get(language, DEFAULT_QUERIES)
    query_str = queries.get("classes", "")
    if not query_str:
        return classes

    try:
        query = lang.query(query_str)
        captures = query.captures(tree.root_node)
    except Exception as e:
        return classes

    # Use byte positions as keys since node IDs aren't stable across traversals
    class_nodes = {}  # start_byte -> node
    class_names = {}  # start_byte -> name
    class_bases = {}  # start_byte -> bases list
    class_bodies = {}  # start_byte -> body node

    for node, name in captures:
        if name == "class":
            key = node.start_byte
            class_nodes[key] = node
        elif name == "class.name":
            # Find the class_definition ancestor
            current = node.parent
            while current:
                if current.type in ("class_definition", "class_declaration", "struct_item",
                                   "impl_item", "trait_item", "interface_declaration"):
                    class_names[current.start_byte] = extract_text(node, source)
                    break
                current = current.parent
        elif name == "class.bases":
            current = node.parent
            while current:
                if current.type in ("class_definition", "class_declaration"):
                    bases_text = extract_text(node, source)
                    bases = re.findall(r'\b([A-Z][a-zA-Z0-9_]*)\b', bases_text)
                    class_bases[current.start_byte] = bases
                    break
                current = current.parent
        elif name == "class.body":
            current = node.parent
            while current:
                if current.type in ("class_definition", "class_declaration", "struct_item",
                                   "impl_item", "trait_item", "interface_declaration"):
                    class_bodies[current.start_byte] = node
                    break
                current = current.parent

    for key, node in class_nodes.items():
        name = class_names.get(key, "")
        if not name:
            continue

        is_private = name.startswith("_") and not name.startswith("__")

        if is_private and not config.include_private:
            continue

        cls = Class(
            name=name,
            bases=class_bases.get(key, []),
            line=node.start_point[0] + 1,
            end_line=node.end_point[0] + 1,
            is_private=is_private
        )

        if config.include_docstrings:
            cls.docstring = extract_docstring(node, source, language)

        classes.append(cls)

    return classes


def parse_functions(source: bytes, tree, language: str, config: Config) -> list[Function]:
    """Parse function definitions from source."""
    functions = []
    lang = get_language(language)
    if not lang:
        return functions

    queries = QUERIES.get(language, DEFAULT_QUERIES)
    query_str = queries.get("functions", "")
    if not query_str:
        return functions

    try:
        query = lang.query(query_str)
        captures = query.captures(tree.root_node)
    except Exception as e:
        return functions

    # Use byte positions as keys
    func_nodes = {}  # start_byte -> node
    func_names = {}  # start_byte -> name
    func_params = {}  # start_byte -> params
    func_returns = {}  # start_byte -> return type
    func_bodies = {}  # start_byte -> body node

    func_types = ("function_definition", "function_declaration",
                  "method_definition", "method_declaration",
                  "function_item", "method", "singleton_method",
                  "arrow_function", "constructor_declaration")

    for node, name in captures:
        if name == "function":
            key = node.start_byte
            func_nodes[key] = node
        elif name == "function.name":
            current = node.parent
            while current:
                if current.type in func_types:
                    func_names[current.start_byte] = extract_text(node, source)
                    break
                current = current.parent
        elif name == "function.params":
            current = node.parent
            while current:
                if current.type in func_types:
                    func_params[current.start_byte] = extract_text(node, source)
                    break
                current = current.parent
        elif name == "function.return_type":
            current = node.parent
            while current:
                if current.type in func_types:
                    func_returns[current.start_byte] = extract_text(node, source)
                    break
                current = current.parent
        elif name == "function.body":
            current = node.parent
            while current:
                if current.type in func_types:
                    func_bodies[current.start_byte] = node
                    break
                current = current.parent

    for key, node in func_nodes.items():
        name = func_names.get(key, "")
        if not name:
            continue

        is_private = name.startswith("_") and not name.startswith("__")

        if is_private and not config.include_private:
            continue

        # Check if it's a method (inside a class)
        is_method = False
        parent = node.parent
        while parent:
            if parent.type in ("class_definition", "class_body", "class_declaration",
                               "impl_item", "declaration_list"):
                is_method = True
                break
            parent = parent.parent

        params = func_params.get(key, "") if config.include_signatures else ""
        return_type = func_returns.get(key, "") if config.include_signatures else ""

        func = Function(
            name=name,
            params=params,
            return_type=return_type,
            line=node.start_point[0] + 1,
            end_line=node.end_point[0] + 1,
            is_method=is_method,
            is_private=is_private
        )

        if config.include_docstrings:
            func.docstring = extract_docstring(node, source, language)

        # Extract function calls
        body_node = func_bodies.get(key)
        if body_node:
            func.calls = extract_calls(source, body_node, language)

        functions.append(func)

    return functions


def extract_calls(source: bytes, body_node, language: str) -> list[str]:
    """Extract function calls from a function body."""
    calls = []
    lang = get_language(language)
    if not lang:
        return calls

    queries = QUERIES.get(language, DEFAULT_QUERIES)
    query_str = queries.get("calls", "")
    if not query_str:
        return calls

    try:
        query = lang.query(query_str)
        captures = query.captures(body_node)
    except Exception:
        return calls

    seen = set()
    for node, name in captures:
        if name == "call.name":
            call_name = extract_text(node, source)
            if call_name and call_name not in seen:
                # Filter out common built-ins
                if call_name not in ("print", "len", "str", "int", "float", "list",
                                     "dict", "set", "tuple", "range", "enumerate",
                                     "zip", "map", "filter", "sorted", "reversed",
                                     "console", "log", "require", "import"):
                    seen.add(call_name)
                    calls.append(call_name)

    return calls[:20]  # Limit to prevent noise


def parse_file(file_path: Path, config: Config) -> FileInfo:
    """Parse a source file and extract code elements."""
    relative_path = file_path.relative_to(config.root_dir)
    ext = file_path.suffix.lower()
    language = LANGUAGE_MAP.get(ext, "")

    info = FileInfo(
        path=file_path,
        relative_path=relative_path,
        language=language
    )

    if not language:
        info.errors.append(f"Unsupported file extension: {ext}")
        return info

    parser = get_parser(language)
    if not parser:
        info.errors.append(f"No parser available for: {language}")
        return info

    try:
        source = file_path.read_bytes()
        tree = parser.parse(source)
    except Exception as e:
        info.errors.append(f"Parse error: {e}")
        return info

    # Extract elements
    info.imports = parse_imports(source, tree, language)

    if config.granularity == "detailed":
        info.classes = parse_classes(source, tree, language, config)
        info.functions = parse_functions(source, tree, language, config)

        # Associate methods with classes
        for cls in info.classes:
            cls.methods = [
                f for f in info.functions
                if f.is_method and cls.line <= f.line <= cls.end_line
            ]
            # Remove methods from top-level functions
            method_names = {m.name for m in cls.methods}
            info.functions = [f for f in info.functions if f.name not in method_names or not f.is_method]

    return info


# =============================================================================
# Relationship Analysis
# =============================================================================

@dataclass
class Relationships:
    """Holds all relationship data."""
    # file -> list of imported modules
    imports: dict[str, list[str]] = field(default_factory=lambda: defaultdict(list))
    # file -> list of files it imports from
    file_deps: dict[str, list[str]] = field(default_factory=lambda: defaultdict(list))
    # class -> list of base classes
    inheritance: dict[str, list[str]] = field(default_factory=lambda: defaultdict(list))
    # function -> list of functions it calls
    call_graph: dict[str, list[str]] = field(default_factory=lambda: defaultdict(list))
    # function name -> file it's defined in
    function_locations: dict[str, str] = field(default_factory=dict)
    # class name -> file it's defined in
    class_locations: dict[str, str] = field(default_factory=dict)


def analyze_relationships(files: list[FileInfo], config: Config) -> Relationships:
    """Analyze relationships between code elements."""
    rels = Relationships()

    # Build indexes
    for file in files:
        file_key = str(file.relative_path)

        # Track imports
        for imp in file.imports:
            rels.imports[file_key].append(imp.module)

        # Track class locations and inheritance
        for cls in file.classes:
            rels.class_locations[cls.name] = file_key
            if cls.bases:
                rels.inheritance[cls.name] = cls.bases

        # Track function locations
        for func in file.functions:
            full_name = f"{file_key}::{func.name}"
            rels.function_locations[func.name] = file_key
            rels.call_graph[full_name] = func.calls

        # Track method locations
        for cls in file.classes:
            for method in cls.methods:
                full_name = f"{cls.name}.{method.name}"
                rels.function_locations[full_name] = file_key
                rels.call_graph[full_name] = method.calls

    # Resolve file dependencies from imports
    for file in files:
        file_key = str(file.relative_path)
        for imp in file.imports:
            # Try to match import to a file
            module = imp.module
            # Convert module path to file path patterns
            patterns = [
                module.replace(".", "/") + ext
                for ext in [".py", ".js", ".ts", ".tsx", ".go", ".rs", ".java"]
            ]
            patterns.extend([
                module.replace(".", "/") + "/index" + ext
                for ext in [".js", ".ts", ".tsx"]
            ])
            patterns.extend([
                module.replace(".", "/") + "/__init__.py"
            ])

            for other_file in files:
                other_key = str(other_file.relative_path)
                if other_key == file_key:
                    continue
                for pattern in patterns:
                    if other_key.endswith(pattern) or pattern in other_key:
                        if other_key not in rels.file_deps[file_key]:
                            rels.file_deps[file_key].append(other_key)
                        break

    return rels


# =============================================================================
# Markdown Generation
# =============================================================================

def generate_markdown(files: list[FileInfo], rels: Relationships, config: Config) -> str:
    """Generate markdown codemap."""
    lines = []

    # Count statistics
    total_classes = sum(len(f.classes) for f in files)
    total_functions = sum(len(f.functions) for f in files)
    total_methods = sum(sum(len(c.methods) for c in f.classes) for f in files)
    languages = set(f.language for f in files if f.language)

    # Header
    lines.append("# Codemap")
    lines.append("")
    lines.append(f"> Auto-generated code map for AI agents")
    lines.append("")
    lines.append("## Summary")
    lines.append("")
    lines.append(f"| Metric | Count |")
    lines.append(f"|--------|-------|")
    lines.append(f"| Files | {len(files)} |")
    lines.append(f"| Languages | {', '.join(sorted(languages)) if languages else 'N/A'} |")
    if config.granularity == "detailed":
        lines.append(f"| Classes/Types | {total_classes} |")
        lines.append(f"| Functions | {total_functions} |")
        lines.append(f"| Methods | {total_methods} |")
    lines.append("")

    # Table of Contents
    lines.append("## Table of Contents")
    lines.append("")
    lines.append("1. [Project Structure](#project-structure)")
    lines.append("2. [File Dependencies](#file-dependencies)")
    if config.granularity == "detailed":
        lines.append("3. [Classes & Types](#classes--types)")
        lines.append("4. [Functions](#functions)")
        lines.append("5. [Inheritance Hierarchy](#inheritance-hierarchy)")
        lines.append("6. [Call Graph](#call-graph)")
    lines.append("7. [File Details](#file-details)")
    lines.append("")

    # Project Structure
    lines.append("## Project Structure")
    lines.append("")
    lines.append("```")

    # Build tree structure
    tree = {}
    for file in files:
        parts = file.relative_path.parts
        current = tree
        for part in parts[:-1]:
            if part not in current:
                current[part] = {}
            current = current[part]
        current[parts[-1]] = None

    def render_tree(node, prefix="", is_last=True):
        items = sorted(node.items(), key=lambda x: (x[1] is None, x[0]))
        for i, (name, children) in enumerate(items):
            is_last_item = i == len(items) - 1
            connector = "└── " if is_last_item else "├── "
            lines.append(f"{prefix}{connector}{name}")
            if children is not None:
                extension = "    " if is_last_item else "│   "
                render_tree(children, prefix + extension, is_last_item)

    lines.append(str(config.root_dir.name) + "/")
    render_tree(tree)
    lines.append("```")
    lines.append("")

    # File Dependencies
    lines.append("## File Dependencies")
    lines.append("")
    lines.append("Shows which files import from other files in this project.")
    lines.append("")

    has_deps = False
    for file_key in sorted(rels.file_deps.keys()):
        deps = rels.file_deps[file_key]
        if deps:
            has_deps = True
            lines.append(f"### `{file_key}`")
            lines.append("")
            lines.append("Depends on:")
            for dep in sorted(deps):
                lines.append(f"- `{dep}`")
            lines.append("")

    if not has_deps:
        lines.append("*No internal file dependencies detected.*")
        lines.append("")

    # Detailed sections
    if config.granularity == "detailed":
        # Classes & Types
        lines.append("## Classes & Types")
        lines.append("")

        all_classes = []
        for file in files:
            for cls in file.classes:
                all_classes.append((file.relative_path, cls))

        if all_classes:
            for file_path, cls in sorted(all_classes, key=lambda x: (str(x[0]), x[1].name)):
                lines.append(f"### `{cls.name}`")
                lines.append("")
                lines.append(f"**File:** `{file_path}` (line {cls.line})")
                if cls.bases:
                    lines.append(f"**Extends:** {', '.join(f'`{b}`' for b in cls.bases)}")
                if cls.docstring:
                    lines.append(f"**Description:** {cls.docstring}")

                if cls.methods:
                    lines.append("")
                    lines.append("**Methods:**")
                    for method in cls.methods:
                        sig = f"{method.name}{method.params}"
                        if method.return_type:
                            sig += f" -> {method.return_type}"
                        lines.append(f"- `{sig}`")
                lines.append("")
        else:
            lines.append("*No classes found.*")
            lines.append("")

        # Functions
        lines.append("## Functions")
        lines.append("")

        all_functions = []
        for file in files:
            for func in file.functions:
                if not func.is_method:
                    all_functions.append((file.relative_path, func))

        if all_functions:
            # Group by file
            by_file = defaultdict(list)
            for file_path, func in all_functions:
                by_file[str(file_path)].append(func)

            for file_path in sorted(by_file.keys()):
                lines.append(f"### `{file_path}`")
                lines.append("")
                for func in sorted(by_file[file_path], key=lambda f: f.line):
                    sig = f"{func.name}{func.params}"
                    if func.return_type:
                        sig += f" -> {func.return_type}"
                    lines.append(f"#### `{func.name}`")
                    lines.append("")
                    lines.append(f"```")
                    lines.append(sig)
                    lines.append("```")
                    if func.docstring:
                        lines.append(f"{func.docstring}")
                    lines.append(f"*Line {func.line}*")
                    lines.append("")
        else:
            lines.append("*No top-level functions found.*")
            lines.append("")

        # Inheritance Hierarchy
        lines.append("## Inheritance Hierarchy")
        lines.append("")

        if rels.inheritance:
            # Find root classes (no bases or bases not in project)
            all_class_names = set(rels.class_locations.keys())

            lines.append("```mermaid")
            lines.append("graph TD")
            for cls_name, bases in sorted(rels.inheritance.items()):
                for base in bases:
                    lines.append(f"    {base} --> {cls_name}")
            lines.append("```")
            lines.append("")
        else:
            lines.append("*No inheritance relationships found.*")
            lines.append("")

        # Call Graph
        lines.append("## Call Graph")
        lines.append("")
        lines.append("Shows function call relationships (limited to project-internal calls).")
        lines.append("")

        # Filter to only include calls to known functions
        known_funcs = set(rels.function_locations.keys())
        has_calls = False

        for caller in sorted(rels.call_graph.keys()):
            calls = rels.call_graph[caller]
            internal_calls = [c for c in calls if c in known_funcs or any(c in k for k in known_funcs)]
            if internal_calls:
                has_calls = True
                lines.append(f"- **`{caller}`** calls:")
                for callee in internal_calls[:10]:
                    lines.append(f"  - `{callee}`")

        if not has_calls:
            lines.append("*No internal call relationships detected.*")
        lines.append("")

    # File Details (imports per file)
    lines.append("## File Details")
    lines.append("")

    for file in sorted(files, key=lambda f: str(f.relative_path)):
        lines.append(f"### `{file.relative_path}`")
        lines.append("")
        lines.append(f"**Language:** {file.language}")

        if file.imports:
            lines.append("")
            lines.append("**Imports:**")
            for imp in file.imports[:15]:  # Limit imports shown
                lines.append(f"- `{imp.module}`")
            if len(file.imports) > 15:
                lines.append(f"- *... and {len(file.imports) - 15} more*")

        if config.granularity == "detailed":
            if file.classes:
                lines.append("")
                lines.append("**Classes:**")
                for cls in file.classes:
                    lines.append(f"- `{cls.name}` (line {cls.line})")

            if file.functions:
                top_funcs = [f for f in file.functions if not f.is_method]
                if top_funcs:
                    lines.append("")
                    lines.append("**Functions:**")
                    for func in top_funcs[:10]:
                        lines.append(f"- `{func.name}` (line {func.line})")
                    if len(top_funcs) > 10:
                        lines.append(f"- *... and {len(top_funcs) - 10} more*")

        if file.errors:
            lines.append("")
            lines.append("**Errors:**")
            for err in file.errors:
                lines.append(f"- {err}")

        lines.append("")

    return "\n".join(lines)


# =============================================================================
# Main
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Generate a codemap for AI agents.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                          # Map current directory, detailed mode
  %(prog)s -g file                  # File/module level only
  %(prog)s -o codemap.md            # Save to specific file
  %(prog)s --include-private        # Include private functions/classes
  %(prog)s /path/to/repo            # Map specific directory
        """
    )

    parser.add_argument(
        "directory",
        nargs="?",
        default=".",
        help="Root directory to analyze (default: current directory)"
    )

    parser.add_argument(
        "-g", "--granularity",
        choices=["file", "detailed"],
        default="detailed",
        help="Granularity level: 'file' for modules only, 'detailed' for classes/functions (default: detailed)"
    )

    parser.add_argument(
        "-o", "--output",
        help="Output file path (default: print to stdout)"
    )

    parser.add_argument(
        "--include-private",
        action="store_true",
        help="Include private functions and classes (those starting with _)"
    )

    parser.add_argument(
        "--no-docstrings",
        action="store_true",
        help="Exclude docstrings from output"
    )

    parser.add_argument(
        "--no-signatures",
        action="store_true",
        help="Exclude function signatures from output"
    )

    parser.add_argument(
        "--max-depth",
        type=int,
        default=10,
        help="Maximum directory depth to traverse (default: 10)"
    )

    parser.add_argument(
        "-q", "--quiet",
        action="store_true",
        help="Suppress progress messages"
    )

    args = parser.parse_args()

    # Build config
    config = Config(
        root_dir=Path(args.directory).resolve(),
        granularity=args.granularity,
        max_depth=args.max_depth,
        include_private=args.include_private,
        include_docstrings=not args.no_docstrings,
        include_signatures=not args.no_signatures,
        output_file=Path(args.output) if args.output else None
    )

    if not config.root_dir.exists():
        print(f"Error: Directory not found: {config.root_dir}", file=sys.stderr)
        sys.exit(1)

    # Discover files
    if not args.quiet:
        print(f"Scanning {config.root_dir}...", file=sys.stderr)

    files = discover_files(config)

    if not files:
        print("No source files found.", file=sys.stderr)
        sys.exit(0)

    if not args.quiet:
        print(f"Found {len(files)} source files", file=sys.stderr)

    # Parse files
    if not args.quiet:
        print("Parsing files...", file=sys.stderr)

    parsed_files = []
    for i, file_path in enumerate(files):
        if not args.quiet and (i + 1) % 50 == 0:
            print(f"  Parsed {i + 1}/{len(files)} files...", file=sys.stderr)
        parsed_files.append(parse_file(file_path, config))

    # Analyze relationships
    if not args.quiet:
        print("Analyzing relationships...", file=sys.stderr)

    relationships = analyze_relationships(parsed_files, config)

    # Generate markdown
    if not args.quiet:
        print("Generating codemap...", file=sys.stderr)

    markdown = generate_markdown(parsed_files, relationships, config)

    # Output
    if config.output_file:
        config.output_file.write_text(markdown)
        if not args.quiet:
            print(f"Codemap written to: {config.output_file}", file=sys.stderr)
    else:
        print(markdown)


if __name__ == "__main__":
    main()
