# Phase 8 browser evidence

These PNGs are captured from the real production Next.js → NestJS → isolated
PostgreSQL browser tests with Mock and fictional profiles. They contain no
credentials or real child data. Dynamic aliases and dates belong to the test run.

| File                            | Evidence                                                              |
| ------------------------------- | --------------------------------------------------------------------- |
| `correction-desktop.png`        | Backend correction after `I likes dogs`; accepted conversation        |
| `summary-desktop.png`           | Completed Animal Adventure, stored 45 XP                              |
| `rewards-desktop.png`           | Same profile, four earned badges and canonical locked criteria        |
| `adult-progress-desktop.png`    | Same persisted 45 XP in adult progress, vocabulary and recent session |
| `providers-desktop.png`         | Separate configuration, activation and explicit test controls         |
| `conversation-mobile.png`       | Text composer, disabled Phase 9 voice, narrow layout                  |
| `profile-form-mobile-small.png` | Adult profile setup and dedicated Luna/Max selection at 360px         |
| `home-tablet.png`               | Responsive child home and backend mission catalog                     |

The [implementation report](../../phase8-implementation-report.md) records
test coverage and limitations. Full fictional-fixture artifacts remain in local
ignored `test-results/` and `playwright-report/`; CI retains them for seven days.
