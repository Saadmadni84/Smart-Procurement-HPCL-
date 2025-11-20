#!/usr/bin/env python3
"""
analyze_rules.py

Simple rule application script for discovery phase.
- Loads `sample_pr_po.csv` and `rules-catalog-template.csv` and attempts basic rule matching.
- Outputs `rule_application_report.csv` and prints a summary of automatable % vs exceptions.

This is a lightweight tool for stakeholders to preview which PRs match rules and which need manual review.
"""
import csv
from pathlib import Path

BASE = Path(__file__).parent
PR_FILE = BASE / "sample_pr_po.csv"
RULES_FILE = BASE.parent / "rules" / "rules-catalog-template.csv"
REPORT_FILE = BASE / "rule_application_report.csv"


def load_rules(path):
    rules = []
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            rules.append(r)
    return rules


def load_prs(path):
    rows = []
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(r)
    return rows


def evaluate_rule(pr, rule):
    # rule fields: field,operator,value
    field = rule.get('field')
    op = rule.get('operator')
    val = rule.get('value')
    if not field or not op:
        return False
    pr_val = pr.get(field, '')
    try:
        if op == 'equals':
            return str(pr_val).strip().lower() == str(val).strip().lower()
        if op == 'greater_than':
            return float(pr_val) > float(val)
        if op == 'less_than':
            return float(pr_val) < float(val)
    except Exception:
        return False
    return False


def main():
    rules = load_rules(RULES_FILE)
    prs = load_prs(PR_FILE)

    report_rows = []
    automatable_count = 0
    total_checks = 0

    for pr in prs:
        pr_id = pr.get('pr_id')
        matched = []
        for r in rules:
            total_checks += 1
            if evaluate_rule(pr, r):
                matched.append(r['rule_id'])
                if r.get('automatable', '').strip().lower() == 'true':
                    automatable_count += 1
        report_rows.append({'pr_id': pr_id, 'matched_rules': ';'.join(matched)})

    # write report
    with open(REPORT_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['pr_id', 'matched_rules'])
        writer.writeheader()
        for r in report_rows:
            writer.writerow(r)

    print('Rule application complete')
    print(f'PRs processed: {len(prs)}')
    print(f'Rule checks executed: {total_checks}')
    if total_checks:
        pct = (automatable_count / total_checks) * 100
    else:
        pct = 0
    print(f'Automatable matches: {automatable_count} ({pct:.1f}% of checks)')
    print(f'Report written to: {REPORT_FILE}')


if __name__ == '__main__':
    main()
