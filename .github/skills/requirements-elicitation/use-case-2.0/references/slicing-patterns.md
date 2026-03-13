# Use Case Slicing Patterns

## Slicing Strategies

### Strategy 1: Happy Path First

Start with the simplest successful path, then add complexity.

```yaml
happy_path_first:
  principle: "Implement basic flow before alternatives"

  example_use_case: "Place Order"

  slices:
    S01:
      name: "Basic Checkout"
      scope:
        - "Basic flow only"
        - "Logged-in customer"
        - "Single item"
        - "Credit card payment"
      value: "Minimum viable checkout"
      priority: "MustHave"

    S02:
      name: "Multi-item Checkout"
      scope:
        - "Basic flow with multiple items"
        - "Quantity variations"
      value: "Real shopping behavior"
      priority: "MustHave"

    S03:
      name: "Guest Checkout"
      scope:
        - "Alternative flow 4a (guest)"
        - "Email capture"
      value: "Lower barrier to purchase"
      priority: "ShouldHave"

    S04:
      name: "Saved Addresses"
      scope:
        - "Alternative flow 5a"
        - "Address book management"
      value: "Faster repeat purchases"
      priority: "CouldHave"
```

### Strategy 2: Risk-First

Implement high-risk slices early to validate architecture and integrations.

```yaml
risk_first:
  principle: "Address technical risks before features"

  example_use_case: "Process Payment"

  slices:
    S01:
      name: "Payment Gateway Integration"
      scope:
        - "Basic flow steps 8-10"
        - "Credit card only"
        - "Success path"
      risk: "External integration complexity"
      value: "Validates payment architecture"
      priority: "MustHave (iteration 1)"

    S02:
      name: "Payment Failure Handling"
      scope:
        - "Exception 10a (declined)"
        - "Retry logic"
      risk: "Error handling complexity"
      value: "Graceful failure experience"
      priority: "MustHave (iteration 2)"

    S03:
      name: "Alternative Payment Methods"
      scope:
        - "PayPal alternative"
        - "Apple Pay alternative"
      risk: "Multiple integration patterns"
      value: "Payment flexibility"
      priority: "ShouldHave"
```

### Strategy 3: Value-Driven

Prioritize by business value regardless of technical complexity.

```yaml
value_driven:
  principle: "Highest value slices first"

  example_use_case: "Search Products"

  slices:
    S01:
      name: "Keyword Search"
      scope:
        - "Basic text search"
        - "Results list"
      business_value: 100  # Highest
      priority: "MustHave"

    S02:
      name: "Category Filtering"
      scope:
        - "Filter by category"
        - "Faceted navigation"
      business_value: 80
      priority: "MustHave"

    S03:
      name: "Price Range Filter"
      scope:
        - "Min/max price"
        - "Predefined ranges"
      business_value: 70
      priority: "ShouldHave"

    S04:
      name: "Advanced Search"
      scope:
        - "Boolean operators"
        - "Field-specific search"
      business_value: 30  # Power users only
      priority: "CouldHave"
```

## Slicing by Dimension

### By Actor

```yaml
slice_by_actor:
  use_case: "Manage User Account"

  slices:
    customer_self_service:
      actor: "Customer"
      flows:
        - "View profile"
        - "Update contact info"
        - "Change password"
      value: "User autonomy"

    admin_management:
      actor: "Admin"
      flows:
        - "Search users"
        - "Reset password"
        - "Suspend account"
      value: "Support capability"

    system_automation:
      actor: "System (scheduled)"
      flows:
        - "Purge inactive accounts"
        - "Send reminder emails"
      value: "Operational efficiency"
```

### By Data Variation

```yaml
slice_by_data:
  use_case: "Import Customer Data"

  slices:
    single_record:
      data: "One customer record"
      scope:
        - "Manual entry"
        - "Full validation"
      value: "Individual updates"

    small_batch:
      data: "CSV file (up to 100 records)"
      scope:
        - "File upload"
        - "Row-by-row validation"
        - "Error report"
      value: "Small migrations"

    bulk_import:
      data: "Large file (1000+ records)"
      scope:
        - "Background processing"
        - "Progress tracking"
        - "Batch validation"
      value: "Major migrations"
```

### By Interface

```yaml
slice_by_interface:
  use_case: "Submit Support Ticket"

  slices:
    web_portal:
      interface: "Web application"
      flows:
        - "Form-based submission"
        - "File attachments"
        - "Rich text description"
      value: "Full-featured submission"

    mobile_app:
      interface: "Mobile application"
      flows:
        - "Simplified form"
        - "Photo attachments"
        - "Voice-to-text"
      value: "On-the-go support"

    api_integration:
      interface: "REST API"
      flows:
        - "Programmatic submission"
        - "Webhook callbacks"
      value: "System integration"

    email_to_ticket:
      interface: "Email"
      flows:
        - "Email parsing"
        - "Attachment handling"
        - "Auto-reply"
      value: "Traditional workflow"
```

### By Business Rule Variation

```yaml
slice_by_rules:
  use_case: "Calculate Shipping Cost"

  slices:
    standard_domestic:
      rules:
        - "Weight-based pricing"
        - "Domestic addresses"
      value: "Core functionality"

    international_shipping:
      rules:
        - "Country-specific rates"
        - "Customs declarations"
        - "Restricted items check"
      value: "Global reach"

    promotional_shipping:
      rules:
        - "Free shipping thresholds"
        - "Promotional codes"
        - "Member discounts"
      value: "Marketing support"

    expedited_options:
      rules:
        - "Express delivery premiums"
        - "Same-day availability"
        - "Time window selection"
      value: "Premium service"
```

## Slice Size Guidelines

### Right-Sized Slices

```yaml
sizing_guidelines:
  story_points:
    ideal: "3-5 points"
    minimum: "1 point (still valuable)"
    maximum: "8 points (consider splitting)"

  effort:
    ideal: "Completable in one sprint"
    warning: "Multi-sprint = too large"

  testability:
    requirement: "Must have clear acceptance criteria"
    warning: "Can't define tests = poorly scoped"

  independence:
    ideal: "Can be released independently"
    acceptable: "Dependencies documented and planned"
```

### Splitting Large Slices

```yaml
splitting_techniques:
  by_scenario:
    before: "All checkout alternatives in one slice"
    after:
      - "Guest checkout slice"
      - "Returning customer slice"
      - "Express checkout slice"

  by_quality:
    before: "Full validation in one slice"
    after:
      - "Basic validation slice"
      - "Advanced validation slice"
      - "Real-time validation slice"

  by_workflow:
    before: "Complete order management"
    after:
      - "Create order slice"
      - "Modify order slice"
      - "Cancel order slice"
```

### Combining Small Slices

```yaml
combining_techniques:
  similar_alternatives:
    before:
      - "Add phone number"
      - "Add email address"
      - "Add mailing address"
    after:
      - "Manage contact information (all channels)"

  related_exceptions:
    before:
      - "Handle timeout"
      - "Handle network error"
      - "Handle server error"
    after:
      - "Error handling and recovery"
```

## Slice Documentation Template

```yaml
slice:
  id: "UC-ORD-001-S03"
  use_case:
    id: "UC-ORD-001"
    name: "Place Order"

  name: "Guest Checkout"
  description: "Allow customers to complete purchase without creating an account"

  scope:
    included_flows:
      - "Basic flow steps 1-3"
      - "Alternative 4a (guest checkout)"
      - "Basic flow steps 5-13"

    excluded_flows:
      - "Alternative 5a (saved addresses)"
      - "Alternative 7a (loyalty points)"

    data_scope:
      - "Single currency (USD)"
      - "Domestic addresses only"

    constraints:
      - "Session-only cart (no persistence)"
      - "Email required for order tracking"

  value_statement: >
    Enables customers to complete purchases without commitment to
    creating an account, reducing cart abandonment for first-time buyers.

  dependencies:
    requires:
      - "UC-ORD-001-S01 (Basic Checkout)"
    enables:
      - "UC-CUS-003-S01 (Post-Purchase Account Creation)"

  acceptance_criteria:
    - given: "Customer has items in cart"
      when: "Customer selects guest checkout"
      then: "System prompts for email and shipping only"

    - given: "Guest customer completes order"
      when: "Order is confirmed"
      then: "Confirmation sent to provided email"

    - given: "Guest customer with same email returns"
      when: "They start new checkout"
      then: "No previous data is pre-filled"

  test_scenarios:
    - "Guest checkout with valid email completes successfully"
    - "Invalid email format is rejected"
    - "Order confirmation email is received"
    - "Guest cannot access order history"
    - "Session timeout preserves cart but not checkout progress"

  estimation:
    story_points: 5
    confidence: "High"
    notes: "Similar to existing checkout, mainly flow changes"

  priority:
    moscow: "ShouldHave"
    business_value: 8  # out of 10
    risk_reduction: 3
    time_sensitivity: "Medium"

  status: "Prepared"
  assigned_sprint: "Sprint 4"
```

## Release Planning with Slices

### MVP Definition

```yaml
mvp_release:
  release: "1.0 MVP"
  goal: "Minimum viable e-commerce functionality"

  included_slices:
    UC-PRD-001-S01: "Browse Products - Basic catalog view"
    UC-PRD-002-S01: "Search Products - Keyword search"
    UC-CRT-001-S01: "Manage Cart - Add/remove items"
    UC-ORD-001-S01: "Place Order - Basic checkout"
    UC-ORD-001-S02: "Place Order - Multi-item checkout"
    UC-PAY-001-S01: "Process Payment - Credit card"

  excluded_for_later:
    UC-ORD-001-S03: "Guest Checkout → Release 1.1"
    UC-PRD-001-S02: "Product Reviews → Release 1.2"
    UC-PAY-001-S02: "PayPal → Release 1.1"

  total_story_points: 34
  planned_sprints: 3
```

### Progressive Enhancement

```yaml
release_progression:
  release_1_0:
    theme: "Core Shopping"
    slices:
      - "Basic product browsing"
      - "Simple search"
      - "Cart management"
      - "Basic checkout"

  release_1_1:
    theme: "Conversion Optimization"
    slices:
      - "Guest checkout"
      - "Alternative payments"
      - "Saved addresses"
      - "Wishlist"

  release_1_2:
    theme: "Engagement"
    slices:
      - "Product reviews"
      - "Recommendations"
      - "Social sharing"
      - "Email marketing integration"

  release_2_0:
    theme: "Scale & Enterprise"
    slices:
      - "B2B ordering"
      - "Bulk operations"
      - "Advanced reporting"
      - "API marketplace"
```

---

**Last Updated:** 2025-12-26
