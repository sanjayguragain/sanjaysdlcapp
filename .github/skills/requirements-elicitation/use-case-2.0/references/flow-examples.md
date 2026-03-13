# Use Case Flow Writing Examples

## Basic Flow Examples

### E-Commerce: Place Order

```markdown
## Basic Flow (Main Success Scenario)

1. Customer views shopping cart contents
2. System displays cart items with quantities and prices
3. Customer clicks "Proceed to Checkout"
4. System requests shipping address
5. Customer enters shipping address
6. System validates address and calculates shipping options
7. Customer selects shipping method
8. System requests payment information
9. Customer enters payment details
10. System validates payment with Payment Gateway
11. System creates order and reserves inventory
12. System sends order confirmation email
13. System displays order confirmation with tracking number
```

### Healthcare: Schedule Appointment

```markdown
## Basic Flow (Main Success Scenario)

1. Patient logs into patient portal
2. System displays patient dashboard
3. Patient selects "Schedule Appointment"
4. System requests appointment type
5. Patient selects appointment type (e.g., "Annual Checkup")
6. System retrieves available providers based on patient's insurance
7. Patient selects preferred provider
8. System displays provider's available time slots
9. Patient selects desired date and time
10. System confirms slot availability
11. System creates appointment record
12. System sends confirmation to patient and provider
13. System displays appointment details with calendar invite
```

### Banking: Transfer Funds

```markdown
## Basic Flow (Main Success Scenario)

1. Customer selects "Transfer Funds" from account menu
2. System displays customer's accounts
3. Customer selects source account
4. System displays source account balance
5. Customer selects destination (own account / other bank / payee)
6. Customer enters transfer amount
7. System validates sufficient funds
8. System displays transfer summary with any fees
9. Customer confirms transfer
10. System requests authentication (2FA)
11. Customer provides authentication code
12. System processes transfer
13. System updates account balances
14. System displays confirmation with reference number
```

## Alternative Flow Examples

### Alternative: Guest Checkout (at step 4)

**Condition:** Customer is not logged in and chooses guest checkout

```markdown
4a. System offers login or guest checkout options
4b. Customer selects "Continue as Guest"
4c. System requests email address for order communications
4d. Customer enters email address
4e. System validates email format
4f. Continue to step 5 (shipping address)
```

### Alternative: Use Saved Address (at step 5)

**Condition:** Customer has previously saved shipping addresses

```markdown
5a. System displays list of saved addresses
5b. Customer selects a saved address
5c. Continue to step 6 (validation)

OR

5a. Customer selects "Enter new address"
5b. Continue with step 5 (enter shipping address)
```

### Alternative: Apply Promotional Code (at step 7)

**Condition:** Customer has a promotional code

```markdown
7a. Customer enters promotional code
7b. System validates promotional code
7c. System applies discount and recalculates totals
7d. System displays updated totals with discount
7e. Continue to step 8 (payment)
```

### Alternative: Schedule for Future Date (at step 10)

**Condition:** Customer wants delayed delivery

```markdown
10a. Customer selects "Schedule delivery"
10b. System displays available delivery dates
10c. Customer selects preferred delivery date
10d. System confirms date selection
10e. Continue to step 11 (authentication)
```

## Exception Flow Examples

### Exception: Invalid Address (at step 6)

**Condition:** Address validation fails

```markdown
6a. System detects invalid address
6b. System displays specific validation error
    - "City not found in postal code"
    - "Street address required"
    - "State/Province not valid for country"
6c. System highlights invalid fields
6d. Customer corrects address
6e. Return to step 6 (validate again)

After 3 failed attempts:
6f. System offers address verification service
6g. Customer confirms suggested address OR enters manual override
6h. Continue to step 7
```

### Exception: Payment Declined (at step 10)

**Condition:** Payment Gateway rejects payment

```markdown
10a. System receives payment declined response
10b. System displays decline reason (if available)
    - "Insufficient funds"
    - "Card expired"
    - "Transaction declined by issuer"
10c. System preserves order information
10d. Customer selects action:
    - Try different payment method → Return to step 8
    - Cancel checkout → Use case ends

After 3 failed payment attempts:
10e. System suggests saving cart and trying later
10f. Use case ends
```

### Exception: Item Out of Stock (at step 11)

**Condition:** Inventory check fails during order creation

```markdown
11a. System detects insufficient inventory
11b. System identifies affected items
11c. System displays options:
    - Remove out-of-stock items and continue
    - Add to waitlist for notification
    - Cancel entire order
11d. Customer selects option
11e. If continuing: System recalculates order total
11f. Return to step 9 (confirm updated order)
```

### Exception: Session Timeout (any step)

**Condition:** User session expires during checkout

```markdown
*a. System detects expired session
*b. System saves cart and checkout progress
*c. System redirects to login page with return URL
*d. Customer logs in
*e. System restores checkout state
*f. Return to interrupted step
```

### Exception: System Unavailable (any step)

**Condition:** Backend service is unavailable

```markdown
*a. System detects service unavailability
*b. System displays friendly error message
*c. System logs error details for support
*d. System offers retry or contact support options
*e. If retry selected and service recovers:
    Return to failed step
*f. Otherwise: Use case ends in failure
```

## Flow Writing Best Practices

### Step Construction Pattern

```yaml
step_template:
  format: "{Actor} {verb} {object} [with {details}]"

  good_examples:
    - "Customer enters shipping address"
    - "System validates payment with Payment Gateway"
    - "Customer selects shipping method from list"
    - "System displays error message with correction suggestions"

  bad_examples:
    - "The address is entered" # Passive voice, no actor
    - "System does stuff" # Vague
    - "Click button" # No actor, imperative
    - "Process and validate and save" # Multiple actions
```

### Actor-System Alternation

```yaml
typical_pattern:
  - "Actor provides input or makes decision"
  - "System processes and responds"
  - "Actor reviews and continues"
  - "System validates and confirms"

exception:
  description: "System-to-system steps are valid"
  example:
    - "System requests authorization from Payment Gateway"
    - "Payment Gateway returns authorization code"
    - "System records transaction"
```

### Abstraction Level Consistency

```yaml
consistent_level:
  user_goal:
    good:
      - "Customer enters shipping address"
      - "System validates address"
    bad:
      - "Customer clicks address field"  # Too detailed
      - "System invokes AddressValidator.validate()" # Implementation

  subfunction:
    good:
      - "System parses address components"
      - "System queries postal database"
    appropriate_for: "Technical use cases included by higher-level ones"
```

## Numbering Conventions

### Basic Flow

```markdown
1. First step
2. Second step
3. Third step
...
```

### Alternative Flows

```markdown
3a. First step of alternative at step 3
3b. Second step of alternative
3c. Third step of alternative
    (Return to step 4 / Use case ends)
```

### Multiple Alternatives at Same Step

```markdown
## Alternative 1: Guest Checkout (at step 3)
3a1. System offers guest option...

## Alternative 2: Social Login (at step 3)
3a2. System offers social login...
```

### Exception Flows

```markdown
## Exception: Payment Failed (at step 8)
8a. System detects payment failure...

## Exception: Timeout (any step)
*a. System detects timeout...
```

---

**Last Updated:** 2025-12-26
