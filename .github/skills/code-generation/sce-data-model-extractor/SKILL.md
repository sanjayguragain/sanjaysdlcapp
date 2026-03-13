---
name: sce-data-model-extractor
description: "Extracts data models from ORMs, migrations, schemas, and raw SQL. Generates Mermaid ER diagrams with cardinality annotations. Documents entity relationships, field constraints, access patterns, and schema health issues. Supports Django, SQLAlchemy, Entity Framework, JPA/Hibernate, Prisma, TypeORM, Active Record, Sequelize, and raw SQL."
compatibility:
  - "3 - Analysis - Reverse Engineering Agent"
license: "Proprietary"
metadata:
  version: 1.0.0
  author: SDLC Analysis Team
  category: code-generation
  tags: [reverse-engineering, data-model, er-diagram, orm, schema, database]
  tools: ['read', 'search', 'execute']
---

# sce-data-model-extractor

## When to Use This Skill

- Reverse engineering database schema from ORM models, migrations, or raw SQL
- Generating ER diagrams from code-defined data models
- Documenting entity relationships, field constraints, and access patterns
- Identifying schema health issues (missing indexes, orphaned models, constraint gaps)
- Understanding how business logic interacts with the data layer

## Unitary Function

**ONE responsibility:** Extract all data model definitions from a codebase, map their relationships, and produce a structured JSON report with Mermaid ER diagrams.

## NOT RESPONSIBLE FOR

- Deep per-file analysis of non-model files (that is `sce-file-deep-analyzer`)
- User flow tracing (that is `sce-flow-mapper`)
- Database performance tuning or query optimization
- Running database migrations or connecting to live databases
- HTML report generation (that is `sce-reverse-engineering-reporter`)

## Input

```json
{
  "data_model_files": [
    {"file_id": "F012", "path": "src/models/user.py", "language": "python"},
    {"file_id": "F013", "path": "src/models/order.py", "language": "python"}
  ],
  "migration_dirs": ["src/migrations/"],
  "language": "python",
  "orm": "django",
  "repo_root": "/absolute/path/to/repo",
  "file_analysis_results": []
}
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `data_model_files` | Yes | List of identified data model files from checklist |
| `migration_dirs` | No | Directories containing migration files |
| `language` | Yes | Primary language |
| `orm` | No | Detected ORM (auto-detected if not provided) |
| `repo_root` | Yes | Repository root for path resolution |
| `file_analysis_results` | No | Phase 2 results for cross-referencing access patterns |

## Output

```json
{
  "generated_by": {
    "skill": "sce-data-model-extractor",
    "version": "1.0.0"
  },
  "database_type": "PostgreSQL",
  "orm": "Django ORM",
  "orm_version": "4.2",
  "total_entities": 15,
  "total_relationships": 22,
  "entities": [
    {
      "name": "User",
      "table_name": "auth_user",
      "file_path": "src/models/user.py",
      "line_start": 10,
      "line_end": 45,
      "abstract": false,
      "inherits_from": "AbstractBaseUser",
      "fields": [
        {
          "name": "id",
          "column_name": "id",
          "type": "BigAutoField",
          "primary_key": true,
          "nullable": false,
          "unique": true,
          "indexed": true,
          "default": "auto-increment"
        },
        {
          "name": "email",
          "column_name": "email",
          "type": "EmailField",
          "max_length": 254,
          "primary_key": false,
          "nullable": false,
          "unique": true,
          "indexed": true,
          "default": null,
          "validators": ["email_format"]
        }
      ],
      "relationships": [
        {
          "type": "one-to-many",
          "target_entity": "Order",
          "field_name": "orders",
          "via_column": "user_id",
          "cascade_delete": "SET_NULL",
          "nullable": true
        }
      ],
      "indexes": [
        {"fields": ["email"], "unique": true, "type": "btree"},
        {"fields": ["created_at"], "unique": false, "type": "btree"}
      ],
      "constraints": [
        {"type": "unique", "fields": ["email"]},
        {"type": "check", "expression": "length(password_hash) >= 60"}
      ],
      "accessed_by": [
        {"file": "auth/views.py", "operations": ["read", "update"]},
        {"file": "services/user_service.py", "operations": ["create", "read", "update", "delete"]}
      ],
      "crud_summary": {
        "create": ["registration", "admin_create"],
        "read": ["login", "profile_view", "user_list"],
        "update": ["profile_edit", "password_change"],
        "delete": ["account_deletion"]
      }
    }
  ],
  "join_tables": [
    {
      "name": "user_roles",
      "table_name": "auth_user_roles",
      "connects": ["User", "Role"],
      "additional_fields": []
    }
  ],
  "inheritance_patterns": [
    {"type": "abstract_base", "parent": "AbstractBaseUser", "children": ["User"]}
  ],
  "er_diagram_mermaid": "erDiagram\n    USER ||--o{ ORDER : places\n    USER }o--o{ ROLE : has\n    ORDER ||--|{ ORDER_ITEM : contains\n    ORDER_ITEM }o--|| PRODUCT : references\n    USER {\n        bigint id PK\n        varchar email UK\n        varchar password_hash\n        timestamp created_at\n    }\n    ORDER {\n        bigint id PK\n        bigint user_id FK\n        varchar status\n        decimal total\n        timestamp created_at\n    }",
  "schema_health": {
    "issues": [
      {
        "severity": "medium",
        "type": "missing_index",
        "entity": "Order",
        "detail": "Order.created_at queried in date range filters but not indexed",
        "recommendation": "Add index on Order.created_at"
      },
      {
        "severity": "low",
        "type": "missing_validation",
        "entity": "User",
        "detail": "User.phone_number has no format validation constraint",
        "recommendation": "Add regex validator for phone number format"
      }
    ],
    "orphaned_models": [],
    "missing_relationships": []
  },
  "migration_summary": {
    "total_migrations": 15,
    "latest": {"name": "0015_add_user_preferences", "date": "2026-01-15"},
    "notable_changes": [
      "0010: Added Order.discount_code field",
      "0013: Changed User.email to unique=True"
    ]
  }
}
```

## ORM Detection & Extraction Patterns

| ORM | Detection | Entity Pattern | Relationship Pattern |
|-----|-----------|---------------|---------------------|
| Django | `from django.db import models`, `models.Model` | `class Name(models.Model):` | `ForeignKey`, `ManyToManyField`, `OneToOneField` |
| SQLAlchemy | `from sqlalchemy import`, `Base = declarative_base()` | `class Name(Base):` | `relationship()`, `ForeignKey()` |
| Entity Framework | `DbContext`, `DbSet<>` | `public class Name` with `DbSet` | Navigation properties, `[ForeignKey]` |
| JPA/Hibernate | `@Entity`, `@Table` | `@Entity public class Name` | `@OneToMany`, `@ManyToOne`, `@ManyToMany` |
| Prisma | `prisma/schema.prisma` | `model Name {` | `@relation`, field references |
| TypeORM | `@Entity()`, `typeorm` | `@Entity() export class Name` | `@OneToMany`, `@ManyToOne`, `@JoinTable` |
| Active Record | `< ApplicationRecord`, `ActiveRecord::Migration` | `class Name < ApplicationRecord` | `has_many`, `belongs_to`, `has_and_belongs_to_many` |
| Sequelize | `sequelize.define`, `Model.init` | `class Name extends Model` | `belongsTo`, `hasMany`, `belongsToMany` |
| Raw SQL | `.sql` files, `CREATE TABLE` | `CREATE TABLE name (` | `FOREIGN KEY`, `REFERENCES` |

## Analysis Process

### Step 1: Identify Data Model Files
1. Use checklist files marked `is_data_model: true`
2. Additionally scan for missed model files using ORM-specific patterns
3. Locate migration directories using framework conventions

### Step 2: Parse Entity Definitions
1. For each model file, extract class/model definitions
2. Parse field definitions: name, type, constraints, defaults
3. Identify primary keys, unique constraints, indexes
4. Parse validators and check constraints

### Step 3: Map Relationships
1. Identify foreign key fields and their targets
2. Classify relationship type (1:1, 1:N, M:N)
3. Identify join tables for M:N relationships
4. Document cascade behavior (CASCADE, SET_NULL, PROTECT, etc.)
5. Detect inheritance patterns (abstract base, multi-table, proxy)

### Step 4: Cross-Reference Access Patterns
1. Using Phase 2 file analysis results, identify which files access each entity
2. Categorize access by CRUD operation type
3. Identify query patterns (filter fields, aggregations, joins)

### Step 5: Generate ER Diagram
1. Build Mermaid ER diagram with all entities and relationships
2. Include field details for key entities (PK, FK, types)
3. Use cardinality notation: `||--o{` (one to many), `}o--o{` (many to many)
4. If >30 entities: split into domain-grouped sub-diagrams + one overview

### Step 6: Assess Schema Health
1. Check for missing indexes on frequently-queried fields
2. Identify orphaned models (defined but never imported/used)
3. Flag missing foreign key constraints
4. Flag fields without validation where business rules suggest constraints

## Quality Checks

- [ ] All model files from checklist have been analyzed
- [ ] Every entity has at least field names and types documented
- [ ] All relationships have cardinality and cascade behavior documented
- [ ] ER diagram includes all entities and relationships
- [ ] ER diagram is valid Mermaid syntax
- [ ] Access patterns cross-referenced against file analysis (if available)
- [ ] Schema health issues have severity and recommendations

## Guardrails

- MUST NOT connect to any live database
- MUST NOT execute migration commands
- MUST NOT modify any model files
- MUST handle models in multiple files/directories
- MUST flag sensitive field names (password, ssn, credit_card) as `[SENSITIVE_FIELD]` without exposing values
- If ORM is unrecognized, attempt generic field extraction via regex and mark confidence as "low"

## Authority Boundaries

**CAN:**
- Read model files, migration files, and schema definitions
- Execute read-only grep/search commands for pattern detection
- Generate Mermaid ER diagram syntax
- Cross-reference with file analysis results

**CANNOT:**
- Connect to or query databases
- Execute migrations
- Modify any source file
- Make assumptions about runtime schema without code evidence
