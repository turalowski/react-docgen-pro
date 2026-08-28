import React from 'react';

/** Level 3 — one nesting level past the 2-level expansion limit. */
export interface Building {
  /** Street address of the office. */
  address: string;
}

/** Level 2. */
export interface Department {
  /** Department name. */
  name: string;
  /** Where the department is based — nested one level too deep to expand. */
  building: Building;
}

/** Level 1 — the prop that starts the chain. */
export interface Employee {
  /** Full display name. */
  name: string;
  department: Department;
}

/**
 * `employee.department` expands (1 level deep), but `department.building`
 * sits at nesting level 2, past the expansion limit — it falls back to
 * the bare `Building` type name instead of a field-by-field breakdown.
 */
export interface OrgChartProps {
  employee: Employee;
}

export function OrgChart(props: OrgChartProps) {
  return <span>{props.employee.name}</span>;
}
