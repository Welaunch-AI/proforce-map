# Operational Entity Graph

Generated: 2026-05-17T17:33:43.375Z

## Nodes
- motive.users (motive)
- motive.vehicle_locations (motive)
- fieldroutes.employee_search (fieldroutes)
- fieldroutes.employee_get (fieldroutes)

## Edges
- motive.vehicle_locations -> motive.users | current_driver.id -> user.id | confidence=high
- fieldroutes.employee_search -> fieldroutes.employee_get | employeeIDs -> employeeID hydration | confidence=high
- fieldroutes.employee_get -> fieldroutes.employee_get | supervisorID -> employeeID | confidence=low
