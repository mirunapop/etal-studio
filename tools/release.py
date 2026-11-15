#!/usr/bin/env python3
"""Monday release: fill in the company details and un-hide them, in one go.

    python3 tools/release.py --kvk 12345678 --vat NL123456789B01 --address "Street 1, 1000 AA Amsterdam"
    python3 tools/release.py ... --dry-run     # show what would change, write nothing

What it does, in every .html file of the repo:
  1. replaces each  <span class="todo" data-fill="kvk|vat|address">...</span>  with your value
  2. removes  ` hidden data-release="company-info"`  from every element that has it
  3. removes the  <meta name="robots" content="noindex" data-release="company-info">  line
     (supplier-details/index.html)

Afterwards it checks that no data-release / data-fill markers are left, and exits
non-zero if any are. It does NOT touch sitemap.xml: see the README checklist.
Standard library only. Run it from anywhere; it finds the repo root itself.
"""
import argparse
import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {"node_modules", ".git", "tools"}

HIDDEN = ' hidden data-release="company-info"'
NOINDEX = '<meta name="robots" content="noindex" data-release="company-info">\n'
FILL = re.compile(r'<span class="todo" data-fill="(kvk|vat|address)">.*?</span>', re.S)


def html_files():
    for p in sorted(ROOT.rglob("*.html")):
        if not SKIP_DIRS.intersection(p.relative_to(ROOT).parts):
            yield p


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--kvk", required=True, help="KvK number, 8 digits")
    ap.add_argument("--vat", required=True, help="VAT ID (btw-id), like NL123456789B01")
    ap.add_argument("--address", required=True, help="business address, on one line")
    ap.add_argument("--dry-run", action="store_true", help="report only, write nothing")
    a = ap.parse_args()

    kvk, vat, address = a.kvk.strip(), a.vat.strip().upper().replace(" ", "").replace(".", ""), " ".join(a.address.split())
    if not re.fullmatch(r"\d{8}", kvk):
        sys.exit("KvK number must be 8 digits.")
    if not re.fullmatch(r"NL\d{9}B\d{2}", vat):
        sys.exit("VAT ID must look like NL123456789B01.")
    if not address:
        sys.exit("Address is empty.")
    values = {"kvk": html.escape(kvk), "vat": html.escape(vat), "address": html.escape(address)}

    totals = {"filled": 0, "unhidden": 0, "noindex": 0}
    leftovers = []
    for p in html_files():
        s = p.read_text(encoding="utf-8")
        orig = s
        s, n = FILL.subn(lambda m: values[m.group(1)], s)
        totals["filled"] += n
        k = s.count(HIDDEN)
        s = s.replace(HIDDEN, "")
        totals["unhidden"] += k
        if NOINDEX in s:
            s = s.replace(NOINDEX, "")
            totals["noindex"] += 1
        if "data-release" in s or "data-fill" in s:
            leftovers.append(p.relative_to(ROOT))
        if s != orig:
            print(f"{'would change' if a.dry_run else 'updated':>12}  {p.relative_to(ROOT)}  (filled {n}, unhidden {k})")
            if not a.dry_run:
                p.write_text(s, encoding="utf-8")

    print(f"\nFilled {totals['filled']} placeholders, unhid {totals['unhidden']} elements, removed noindex from {totals['noindex']} page(s).")
    if leftovers:
        print("\nMarkers still present (edit by hand, see the README checklist):")
        for p in leftovers:
            print("  ", p)
        sys.exit(1)
    if a.dry_run:
        print("Dry run: nothing written.")
    else:
        print("Done. Now: check the pages locally, then commit.")


if __name__ == "__main__":
    main()
