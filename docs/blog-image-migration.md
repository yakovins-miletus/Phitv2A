# Blog image migration — PNG/JPG → WebP

**Status: prepared, NOT active.** Both formats are on disk. The site still serves the
original `.png`/`.jpg`, because the paths that reference them live in **backend content**,
not in this repo.

## Why this needs the backend

`src/features/blog/fallback.ts` contains no image paths at all. Blog bodies are fetched
from `VITE_API_URL`, and a body paragraph that is *entirely* an image path renders as an
image — see `src/features/blog/bodyImages.ts`, which names its server-side twin as
`backend/app/features/blog/body_images.py`.

So the strings below are stored in the backend's post bodies. Renaming the files here
without updating that content would 404 every image in every article.

The frontend is already compatible: `IMAGE_PARAGRAPH` in `bodyImages.ts` accepts
`webp` (and `avif`) today. **No frontend change is needed to switch over.**

## The switch

1. Backend: replace each `old` path with its `new` path in the stored post bodies.
2. Verify a few articles render.
3. Delete the superseded originals:
   ```bash
   find public/images/blog -type f \( -name '*.png' -o -name '*.jpg' \) -delete
   ```
4. Rebuild.

## Rollback

The originals are in git: `git checkout public/images/blog`.

## Saving

| | Size |
|---|---:|
| current (png/jpg) | 68.6 MB |
| after switch (webp) | 38.3 MB |
| **saved** | **30.3 MB** |

## Path map (177 files)

| old | new | before | after |
|---|---|---:|---:|
| `/images/blog/2024-grads-batch-2-grad-week/01.jpg` | `/images/blog/2024-grads-batch-2-grad-week/01.webp` | 106 KB | 90 KB |
| `/images/blog/2024-grads-batch-2-grad-week/02.jpg` | `/images/blog/2024-grads-batch-2-grad-week/02.webp` | 194 KB | 185 KB |
| `/images/blog/2024-grads-batch-2-grad-week/03.png` | `/images/blog/2024-grads-batch-2-grad-week/03.webp` | 675 KB | 366 KB |
| `/images/blog/2024-grads-batch-2-grad-week/04.jpg` | `/images/blog/2024-grads-batch-2-grad-week/04.webp` | 115 KB | 100 KB |
| `/images/blog/2024-grads-batch-2-grad-week/05.png` | `/images/blog/2024-grads-batch-2-grad-week/05.webp` | 122 KB | 46 KB |
| `/images/blog/2024-graduates-aws-cloud-practitioner-certification/01.jpg` | `/images/blog/2024-graduates-aws-cloud-practitioner-certification/01.webp` | 145 KB | 113 KB |
| `/images/blog/2024-graduates-aws-cloud-practitioner-certification/02.png` | `/images/blog/2024-graduates-aws-cloud-practitioner-certification/02.webp` | 478 KB | 143 KB |
| `/images/blog/2024-summer-outing/01.png` | `/images/blog/2024-summer-outing/01.webp` | 755 KB | 446 KB |
| `/images/blog/2024-summer-outing/02.png` | `/images/blog/2024-summer-outing/02.webp` | 793 KB | 492 KB |
| `/images/blog/2024-summer-outing/03.png` | `/images/blog/2024-summer-outing/03.webp` | 750 KB | 445 KB |
| `/images/blog/2024-summer-outing/04.png` | `/images/blog/2024-summer-outing/04.webp` | 746 KB | 435 KB |
| `/images/blog/2024-technical-graduates-batch-1-two-years-milestones-of-growth/01.jpg` | `/images/blog/2024-technical-graduates-batch-1-two-years-milestones-of-growth/01.webp` | 166 KB | 152 KB |
| `/images/blog/2024-technical-graduates-batch-1-two-years-milestones-of-growth/02.png` | `/images/blog/2024-technical-graduates-batch-1-two-years-milestones-of-growth/02.webp` | 800 KB | 456 KB |
| `/images/blog/2024-technical-graduates-batch-1-two-years-milestones-of-growth/03.png` | `/images/blog/2024-technical-graduates-batch-1-two-years-milestones-of-growth/03.webp` | 674 KB | 386 KB |
| `/images/blog/2024-technical-graduates-batch-1-two-years-milestones-of-growth/04.jpg` | `/images/blog/2024-technical-graduates-batch-1-two-years-milestones-of-growth/04.webp` | 134 KB | 112 KB |
| `/images/blog/2024-technical-graduates-batch-1-two-years-milestones-of-growth/05.jpg` | `/images/blog/2024-technical-graduates-batch-1-two-years-milestones-of-growth/05.webp` | 159 KB | 145 KB |
| `/images/blog/2025-summer-outing-a-splash-of-fun-at-floating-sanctuary/01.jpg` | `/images/blog/2025-summer-outing-a-splash-of-fun-at-floating-sanctuary/01.webp` | 115 KB | 107 KB |
| `/images/blog/2025-summer-outing-a-splash-of-fun-at-floating-sanctuary/02.png` | `/images/blog/2025-summer-outing-a-splash-of-fun-at-floating-sanctuary/02.webp` | 312 KB | 132 KB |
| `/images/blog/2025-summer-outing-a-splash-of-fun-at-floating-sanctuary/03.jpg` | `/images/blog/2025-summer-outing-a-splash-of-fun-at-floating-sanctuary/03.webp` | 261 KB | 237 KB |
| `/images/blog/2025-summer-outing-a-splash-of-fun-at-floating-sanctuary/04.png` | `/images/blog/2025-summer-outing-a-splash-of-fun-at-floating-sanctuary/04.webp` | 752 KB | 459 KB |
| `/images/blog/2025-summer-outing-a-splash-of-fun-at-floating-sanctuary/05.jpg` | `/images/blog/2025-summer-outing-a-splash-of-fun-at-floating-sanctuary/05.webp` | 141 KB | 133 KB |
| `/images/blog/2025-summer-outing-a-splash-of-fun-at-floating-sanctuary/06.jpg` | `/images/blog/2025-summer-outing-a-splash-of-fun-at-floating-sanctuary/06.webp` | 186 KB | 183 KB |
| `/images/blog/2025-summer-outing-a-splash-of-fun-at-floating-sanctuary/07.png` | `/images/blog/2025-summer-outing-a-splash-of-fun-at-floating-sanctuary/07.webp` | 541 KB | 260 KB |
| `/images/blog/2026-technical-graduate-batch-1-onboarding-week/01.png` | `/images/blog/2026-technical-graduate-batch-1-onboarding-week/01.webp` | 1017 KB | 579 KB |
| `/images/blog/2026-technical-graduate-batch-1-onboarding-week/02.png` | `/images/blog/2026-technical-graduate-batch-1-onboarding-week/02.webp` | 395 KB | 85 KB |
| `/images/blog/2026-technical-graduate-batch-1-onboarding-week/03.png` | `/images/blog/2026-technical-graduate-batch-1-onboarding-week/03.webp` | 584 KB | 246 KB |
| `/images/blog/2026-technical-graduate-batch-1-onboarding-week/04.png` | `/images/blog/2026-technical-graduate-batch-1-onboarding-week/04.webp` | 1146 KB | 659 KB |
| `/images/blog/2026-wellness-week/01.jpg` | `/images/blog/2026-wellness-week/01.webp` | 117 KB | 115 KB |
| `/images/blog/2026-wellness-week/02.png` | `/images/blog/2026-wellness-week/02.webp` | 190 KB | 73 KB |
| `/images/blog/2026-wellness-week/03.jpg` | `/images/blog/2026-wellness-week/03.webp` | 79 KB | 60 KB |
| `/images/blog/2026-wellness-week/04.png` | `/images/blog/2026-wellness-week/04.webp` | 272 KB | 93 KB |
| `/images/blog/2026-wellness-week/05.jpg` | `/images/blog/2026-wellness-week/05.webp` | 105 KB | 87 KB |
| `/images/blog/2026-wellness-week/06.jpg` | `/images/blog/2026-wellness-week/06.webp` | 60 KB | 45 KB |
| `/images/blog/a-week-with-ben-collaboration-culture-and-celebration/01.jpg` | `/images/blog/a-week-with-ben-collaboration-culture-and-celebration/01.webp` | 17 KB | 10 KB |
| `/images/blog/a-week-with-ben-collaboration-culture-and-celebration/02.jpg` | `/images/blog/a-week-with-ben-collaboration-culture-and-celebration/02.webp` | 98 KB | 88 KB |
| `/images/blog/a-week-with-ben-collaboration-culture-and-celebration/03.jpg` | `/images/blog/a-week-with-ben-collaboration-culture-and-celebration/03.webp` | 119 KB | 112 KB |
| `/images/blog/a-week-with-ben-collaboration-culture-and-celebration/04.png` | `/images/blog/a-week-with-ben-collaboration-culture-and-celebration/04.webp` | 354 KB | 203 KB |
| `/images/blog/a-week-with-ben-collaboration-culture-and-celebration/05.png` | `/images/blog/a-week-with-ben-collaboration-culture-and-celebration/05.webp` | 974 KB | 574 KB |
| `/images/blog/a-week-with-ben-collaboration-culture-and-celebration/06.jpg` | `/images/blog/a-week-with-ben-collaboration-culture-and-celebration/06.webp` | 145 KB | 126 KB |
| `/images/blog/a-week-with-ben-collaboration-culture-and-celebration/07.png` | `/images/blog/a-week-with-ben-collaboration-culture-and-celebration/07.webp` | 332 KB | 114 KB |
| `/images/blog/a-week-with-ben-collaboration-culture-and-celebration/08.png` | `/images/blog/a-week-with-ben-collaboration-culture-and-celebration/08.webp` | 379 KB | 125 KB |
| `/images/blog/a-work-day-in-software-engineering/01.png` | `/images/blog/a-work-day-in-software-engineering/01.webp` | 439 KB | 254 KB |
| `/images/blog/a-work-day-in-software-engineering/02.png` | `/images/blog/a-work-day-in-software-engineering/02.webp` | 571 KB | 154 KB |
| `/images/blog/a-work-day-in-software-engineering/03.png` | `/images/blog/a-work-day-in-software-engineering/03.webp` | 686 KB | 374 KB |
| `/images/blog/a-work-day-in-software-engineering/04.png` | `/images/blog/a-work-day-in-software-engineering/04.webp` | 544 KB | 202 KB |
| `/images/blog/a-work-day-in-software-engineering/05.png` | `/images/blog/a-work-day-in-software-engineering/05.webp` | 742 KB | 432 KB |
| `/images/blog/ai-day-2-0-smarter-systems-faster-teams/01.png` | `/images/blog/ai-day-2-0-smarter-systems-faster-teams/01.webp` | 361 KB | 197 KB |
| `/images/blog/ai-day-2-0-smarter-systems-faster-teams/02.png` | `/images/blog/ai-day-2-0-smarter-systems-faster-teams/02.webp` | 594 KB | 314 KB |
| `/images/blog/ai-day-2-0-smarter-systems-faster-teams/03.png` | `/images/blog/ai-day-2-0-smarter-systems-faster-teams/03.webp` | 428 KB | 232 KB |
| `/images/blog/ai-day-2-0-smarter-systems-faster-teams/04.jpg` | `/images/blog/ai-day-2-0-smarter-systems-faster-teams/04.webp` | 88 KB | 68 KB |
| `/images/blog/ateneo-career-talk-2025/01.png` | `/images/blog/ateneo-career-talk-2025/01.webp` | 40 KB | 17 KB |
| `/images/blog/ateneo-career-talk-2025/02.png` | `/images/blog/ateneo-career-talk-2025/02.webp` | 228 KB | 129 KB |
| `/images/blog/celebrating-five-years-of-success-phitopolis-5th-anniversary/01.jpg` | `/images/blog/celebrating-five-years-of-success-phitopolis-5th-anniversary/01.webp` | 110 KB | 81 KB |
| `/images/blog/celebrating-five-years-of-success-phitopolis-5th-anniversary/02.png` | `/images/blog/celebrating-five-years-of-success-phitopolis-5th-anniversary/02.webp` | 706 KB | 299 KB |
| `/images/blog/celebrating-five-years-of-success-phitopolis-5th-anniversary/03.png` | `/images/blog/celebrating-five-years-of-success-phitopolis-5th-anniversary/03.webp` | 738 KB | 435 KB |
| `/images/blog/celebrating-five-years-of-success-phitopolis-5th-anniversary/04.png` | `/images/blog/celebrating-five-years-of-success-phitopolis-5th-anniversary/04.webp` | 737 KB | 435 KB |
| `/images/blog/celebrating-five-years-of-success-phitopolis-5th-anniversary/05.png` | `/images/blog/celebrating-five-years-of-success-phitopolis-5th-anniversary/05.webp` | 713 KB | 405 KB |
| `/images/blog/celebrating-five-years-of-success-phitopolis-5th-anniversary/06.png` | `/images/blog/celebrating-five-years-of-success-phitopolis-5th-anniversary/06.webp` | 681 KB | 385 KB |
| `/images/blog/celebrating-five-years-of-success-phitopolis-5th-anniversary/07.png` | `/images/blog/celebrating-five-years-of-success-phitopolis-5th-anniversary/07.webp` | 703 KB | 403 KB |
| `/images/blog/celebrating-five-years-of-success-phitopolis-5th-anniversary/08.jpg` | `/images/blog/celebrating-five-years-of-success-phitopolis-5th-anniversary/08.webp` | 298 KB | 265 KB |
| `/images/blog/christmas-party-2024/01.png` | `/images/blog/christmas-party-2024/01.webp` | 600 KB | 359 KB |
| `/images/blog/christmas-party-2024/02.png` | `/images/blog/christmas-party-2024/02.webp` | 103 KB | 52 KB |
| `/images/blog/christmas-party-2024/03.png` | `/images/blog/christmas-party-2024/03.webp` | 618 KB | 205 KB |
| `/images/blog/christmas-party-2024/04.png` | `/images/blog/christmas-party-2024/04.webp` | 661 KB | 201 KB |
| `/images/blog/christmas-party-2024/05.png` | `/images/blog/christmas-party-2024/05.webp` | 615 KB | 374 KB |
| `/images/blog/christmas-party-2024/06.png` | `/images/blog/christmas-party-2024/06.webp` | 742 KB | 430 KB |
| `/images/blog/christmas-party-2024/07.png` | `/images/blog/christmas-party-2024/07.webp` | 119 KB | 58 KB |
| `/images/blog/compassion-in-action-phitopolis-gives-back-at-tahanan-ng-pagmamahal/01.png` | `/images/blog/compassion-in-action-phitopolis-gives-back-at-tahanan-ng-pagmamahal/01.webp` | 946 KB | 552 KB |
| `/images/blog/compassion-in-action-phitopolis-gives-back-at-tahanan-ng-pagmamahal/02.png` | `/images/blog/compassion-in-action-phitopolis-gives-back-at-tahanan-ng-pagmamahal/02.webp` | 981 KB | 517 KB |
| `/images/blog/compassion-in-action-phitopolis-gives-back-at-tahanan-ng-pagmamahal/03.png` | `/images/blog/compassion-in-action-phitopolis-gives-back-at-tahanan-ng-pagmamahal/03.webp` | 969 KB | 512 KB |
| `/images/blog/compassion-in-action-phitopolis-gives-back-at-tahanan-ng-pagmamahal/04.png` | `/images/blog/compassion-in-action-phitopolis-gives-back-at-tahanan-ng-pagmamahal/04.webp` | 973 KB | 519 KB |
| `/images/blog/csr-activity-100-slippers-for-100-kids/01.png` | `/images/blog/csr-activity-100-slippers-for-100-kids/01.webp` | 749 KB | 440 KB |
| `/images/blog/csr-activity-100-slippers-for-100-kids/02.jpg` | `/images/blog/csr-activity-100-slippers-for-100-kids/02.webp` | 217 KB | 192 KB |
| `/images/blog/csr-activity-100-slippers-for-100-kids/03.png` | `/images/blog/csr-activity-100-slippers-for-100-kids/03.webp` | 1074 KB | 622 KB |
| `/images/blog/csr-activity-beautification-project-for-st-joseph-chapel-and-st-andrew-parish-church/01.jpg` | `/images/blog/csr-activity-beautification-project-for-st-joseph-chapel-and-st-andrew-parish-church/01.webp` | 55 KB | 24 KB |
| `/images/blog/csr-activity-beautification-project-for-st-joseph-chapel-and-st-andrew-parish-church/02.png` | `/images/blog/csr-activity-beautification-project-for-st-joseph-chapel-and-st-andrew-parish-church/02.webp` | 324 KB | 46 KB |
| `/images/blog/csr-activity-beautification-project-for-st-joseph-chapel-and-st-andrew-parish-church/03.png` | `/images/blog/csr-activity-beautification-project-for-st-joseph-chapel-and-st-andrew-parish-church/03.webp` | 334 KB | 50 KB |
| `/images/blog/csr-activity-beautification-project-for-st-joseph-chapel-and-st-andrew-parish-church/04.png` | `/images/blog/csr-activity-beautification-project-for-st-joseph-chapel-and-st-andrew-parish-church/04.webp` | 339 KB | 54 KB |
| `/images/blog/csr-activity-brigada-eskwela-at-gen-ricardo-g-papa-sr-memorial-high-school/01.jpg` | `/images/blog/csr-activity-brigada-eskwela-at-gen-ricardo-g-papa-sr-memorial-high-school/01.webp` | 194 KB | 163 KB |
| `/images/blog/csr-activity-brigada-eskwela-at-gen-ricardo-g-papa-sr-memorial-high-school/02.png` | `/images/blog/csr-activity-brigada-eskwela-at-gen-ricardo-g-papa-sr-memorial-high-school/02.webp` | 219 KB | 76 KB |
| `/images/blog/csr-activity-brigada-eskwela-at-gen-ricardo-g-papa-sr-memorial-high-school/03.jpg` | `/images/blog/csr-activity-brigada-eskwela-at-gen-ricardo-g-papa-sr-memorial-high-school/03.webp` | 167 KB | 139 KB |
| `/images/blog/csr-activity-brigada-eskwela-at-gen-ricardo-g-papa-sr-memorial-high-school/04.jpg` | `/images/blog/csr-activity-brigada-eskwela-at-gen-ricardo-g-papa-sr-memorial-high-school/04.webp` | 135 KB | 105 KB |
| `/images/blog/csr-activity-gift-it-forward-christmas-gift-giving-at-brgy-pinagsama/01.png` | `/images/blog/csr-activity-gift-it-forward-christmas-gift-giving-at-brgy-pinagsama/01.webp` | 891 KB | 523 KB |
| `/images/blog/csr-activity-gift-it-forward-christmas-gift-giving-at-brgy-pinagsama/02.jpg` | `/images/blog/csr-activity-gift-it-forward-christmas-gift-giving-at-brgy-pinagsama/02.webp` | 322 KB | 309 KB |
| `/images/blog/csr-activity-gift-it-forward-christmas-gift-giving-at-brgy-pinagsama/03.png` | `/images/blog/csr-activity-gift-it-forward-christmas-gift-giving-at-brgy-pinagsama/03.webp` | 547 KB | 332 KB |
| `/images/blog/csr-activity-gift-it-forward-christmas-gift-giving-at-brgy-pinagsama/04.png` | `/images/blog/csr-activity-gift-it-forward-christmas-gift-giving-at-brgy-pinagsama/04.webp` | 210 KB | 68 KB |
| `/images/blog/csr-activity-gift-it-forward-christmas-gift-giving-at-brgy-pinagsama/05.png` | `/images/blog/csr-activity-gift-it-forward-christmas-gift-giving-at-brgy-pinagsama/05.webp` | 857 KB | 492 KB |
| `/images/blog/csr-activity-gift-it-forward-christmas-gift-giving-at-brgy-pinagsama/06.png` | `/images/blog/csr-activity-gift-it-forward-christmas-gift-giving-at-brgy-pinagsama/06.webp` | 525 KB | 319 KB |
| `/images/blog/csr-activity-gift-it-forward-christmas-gift-giving-at-brgy-pinagsama/07.jpg` | `/images/blog/csr-activity-gift-it-forward-christmas-gift-giving-at-brgy-pinagsama/07.webp` | 299 KB | 281 KB |
| `/images/blog/csr-activity-repainting-community-spaces/01.jpg` | `/images/blog/csr-activity-repainting-community-spaces/01.webp` | 41 KB | 31 KB |
| `/images/blog/csr-activity-repainting-community-spaces/02.png` | `/images/blog/csr-activity-repainting-community-spaces/02.webp` | 732 KB | 438 KB |
| `/images/blog/csr-activity-repainting-community-spaces/03.png` | `/images/blog/csr-activity-repainting-community-spaces/03.webp` | 475 KB | 275 KB |
| `/images/blog/csr-activity-repainting-community-spaces/04.png` | `/images/blog/csr-activity-repainting-community-spaces/04.webp` | 352 KB | 214 KB |
| `/images/blog/csr-activity-repainting-community-spaces/05.png` | `/images/blog/csr-activity-repainting-community-spaces/05.webp` | 751 KB | 440 KB |
| `/images/blog/data-ops-training-in-clark-pampanga/01.png` | `/images/blog/data-ops-training-in-clark-pampanga/01.webp` | 427 KB | 105 KB |
| `/images/blog/data-ops-training-in-clark-pampanga/02.png` | `/images/blog/data-ops-training-in-clark-pampanga/02.webp` | 78 KB | 23 KB |
| `/images/blog/data-ops-training-in-clark-pampanga/03.png` | `/images/blog/data-ops-training-in-clark-pampanga/03.webp` | 104 KB | 31 KB |
| `/images/blog/data-ops-training-in-clark-pampanga/04.png` | `/images/blog/data-ops-training-in-clark-pampanga/04.webp` | 159 KB | 47 KB |
| `/images/blog/devops-funtopolis-summer-outing/01.jpg` | `/images/blog/devops-funtopolis-summer-outing/01.webp` | 219 KB | 201 KB |
| `/images/blog/devops-funtopolis-summer-outing/02.jpg` | `/images/blog/devops-funtopolis-summer-outing/02.webp` | 251 KB | 247 KB |
| `/images/blog/devops-funtopolis-summer-outing/03.jpg` | `/images/blog/devops-funtopolis-summer-outing/03.webp` | 296 KB | 278 KB |
| `/images/blog/devops-funtopolis-summer-outing/04.jpg` | `/images/blog/devops-funtopolis-summer-outing/04.webp` | 284 KB | 262 KB |
| `/images/blog/devops-funtopolis-summer-outing/06.jpg` | `/images/blog/devops-funtopolis-summer-outing/06.webp` | 196 KB | 173 KB |
| `/images/blog/devops-funtopolis-summer-outing/07.jpg` | `/images/blog/devops-funtopolis-summer-outing/07.webp` | 302 KB | 278 KB |
| `/images/blog/dlsu-2025-job-expo-raffle-winners/01.png` | `/images/blog/dlsu-2025-job-expo-raffle-winners/01.webp` | 720 KB | 137 KB |
| `/images/blog/dlsu-job-expo-2025/01.png` | `/images/blog/dlsu-job-expo-2025/01.webp` | 606 KB | 350 KB |
| `/images/blog/dlsu-job-expo-2025/02.png` | `/images/blog/dlsu-job-expo-2025/02.webp` | 624 KB | 365 KB |
| `/images/blog/dlsu-job-expo-2025/03.png` | `/images/blog/dlsu-job-expo-2025/03.webp` | 599 KB | 337 KB |
| `/images/blog/expanding-horizons-phitopolis-unveils-its-new-office/01.png` | `/images/blog/expanding-horizons-phitopolis-unveils-its-new-office/01.webp` | 121 KB | 52 KB |
| `/images/blog/expanding-horizons-phitopolis-unveils-its-new-office/02.jpg` | `/images/blog/expanding-horizons-phitopolis-unveils-its-new-office/02.webp` | 139 KB | 111 KB |
| `/images/blog/expanding-horizons-phitopolis-unveils-its-new-office/03.png` | `/images/blog/expanding-horizons-phitopolis-unveils-its-new-office/03.webp` | 716 KB | 415 KB |
| `/images/blog/expanding-horizons-phitopolis-unveils-its-new-office/04.png` | `/images/blog/expanding-horizons-phitopolis-unveils-its-new-office/04.webp` | 110 KB | 38 KB |
| `/images/blog/from-new-york-to-manila-toms-ph-visit/01.png` | `/images/blog/from-new-york-to-manila-toms-ph-visit/01.webp` | 783 KB | 486 KB |
| `/images/blog/from-new-york-to-manila-toms-ph-visit/02.png` | `/images/blog/from-new-york-to-manila-toms-ph-visit/02.webp` | 750 KB | 456 KB |
| `/images/blog/from-new-york-to-manila-toms-ph-visit/03.png` | `/images/blog/from-new-york-to-manila-toms-ph-visit/03.webp` | 789 KB | 495 KB |
| `/images/blog/from-new-york-to-manila-toms-ph-visit/04.png` | `/images/blog/from-new-york-to-manila-toms-ph-visit/04.webp` | 779 KB | 489 KB |
| `/images/blog/game-on-boomerang-fu-brings-the-heat-and-the-chaos/01.jpg` | `/images/blog/game-on-boomerang-fu-brings-the-heat-and-the-chaos/01.webp` | 64 KB | 40 KB |
| `/images/blog/game-on-boomerang-fu-brings-the-heat-and-the-chaos/02.jpg` | `/images/blog/game-on-boomerang-fu-brings-the-heat-and-the-chaos/02.webp` | 101 KB | 77 KB |
| `/images/blog/hike-with-mike/01.jpg` | `/images/blog/hike-with-mike/01.webp` | 265 KB | 240 KB |
| `/images/blog/immersion-in-dataops-a-journey-behind-the-scenes-of-data-operations/01.jpg` | `/images/blog/immersion-in-dataops-a-journey-behind-the-scenes-of-data-operations/01.webp` | 139 KB | 110 KB |
| `/images/blog/immersion-in-dataops-a-journey-behind-the-scenes-of-data-operations/02.png` | `/images/blog/immersion-in-dataops-a-journey-behind-the-scenes-of-data-operations/02.webp` | 1169 KB | 647 KB |
| `/images/blog/immersion-in-dataops-a-journey-behind-the-scenes-of-data-operations/03.jpg` | `/images/blog/immersion-in-dataops-a-journey-behind-the-scenes-of-data-operations/03.webp` | 237 KB | 220 KB |
| `/images/blog/immersion-in-dataops-a-journey-behind-the-scenes-of-data-operations/04.png` | `/images/blog/immersion-in-dataops-a-journey-behind-the-scenes-of-data-operations/04.webp` | 1027 KB | 581 KB |
| `/images/blog/inspiring-the-next-generation-of-quants-our-talks-at-the-google-developers-student-club-dlsu/01.jpg` | `/images/blog/inspiring-the-next-generation-of-quants-our-talks-at-the-google-developers-student-club-dlsu/01.webp` | 97 KB | 70 KB |
| `/images/blog/inspiring-the-next-generation-of-quants-our-talks-at-the-google-developers-student-club-dlsu/02.jpg` | `/images/blog/inspiring-the-next-generation-of-quants-our-talks-at-the-google-developers-student-club-dlsu/02.webp` | 97 KB | 70 KB |
| `/images/blog/inspiring-the-next-generation-of-quants-our-talks-at-the-google-developers-student-club-dlsu/03.jpg` | `/images/blog/inspiring-the-next-generation-of-quants-our-talks-at-the-google-developers-student-club-dlsu/03.webp` | 99 KB | 69 KB |
| `/images/blog/joy-in-every-bag-christmas-gift-giving-at-brgy-pinagsama/01.jpg` | `/images/blog/joy-in-every-bag-christmas-gift-giving-at-brgy-pinagsama/01.webp` | 287 KB | 275 KB |
| `/images/blog/joy-in-every-bag-christmas-gift-giving-at-brgy-pinagsama/02.png` | `/images/blog/joy-in-every-bag-christmas-gift-giving-at-brgy-pinagsama/02.webp` | 262 KB | 108 KB |
| `/images/blog/joy-in-every-bag-christmas-gift-giving-at-brgy-pinagsama/03.png` | `/images/blog/joy-in-every-bag-christmas-gift-giving-at-brgy-pinagsama/03.webp` | 191 KB | 90 KB |
| `/images/blog/joy-in-every-bag-christmas-gift-giving-at-brgy-pinagsama/04.png` | `/images/blog/joy-in-every-bag-christmas-gift-giving-at-brgy-pinagsama/04.webp` | 330 KB | 158 KB |
| `/images/blog/likhapolis-pagbibigay-kulay-at-saya/01.png` | `/images/blog/likhapolis-pagbibigay-kulay-at-saya/01.webp` | 482 KB | 120 KB |
| `/images/blog/likhapolis-pagbibigay-kulay-at-saya/02.jpg` | `/images/blog/likhapolis-pagbibigay-kulay-at-saya/02.webp` | 197 KB | 161 KB |
| `/images/blog/likhapolis-pagbibigay-kulay-at-saya/03.jpg` | `/images/blog/likhapolis-pagbibigay-kulay-at-saya/03.webp` | 213 KB | 193 KB |
| `/images/blog/likhapolis-pagbibigay-kulay-at-saya/04.jpg` | `/images/blog/likhapolis-pagbibigay-kulay-at-saya/04.webp` | 182 KB | 152 KB |
| `/images/blog/meet-the-ai-engineering-team/01.png` | `/images/blog/meet-the-ai-engineering-team/01.webp` | 475 KB | 275 KB |
| `/images/blog/meet-the-ai-engineering-team/02.png` | `/images/blog/meet-the-ai-engineering-team/02.webp` | 773 KB | 472 KB |
| `/images/blog/meet-the-ai-engineering-team/03.png` | `/images/blog/meet-the-ai-engineering-team/03.webp` | 795 KB | 494 KB |
| `/images/blog/night-out-with-investors/01.png` | `/images/blog/night-out-with-investors/01.webp` | 1049 KB | 615 KB |
| `/images/blog/night-out-with-investors/02.jpg` | `/images/blog/night-out-with-investors/02.webp` | 135 KB | 115 KB |
| `/images/blog/night-out-with-investors/03.png` | `/images/blog/night-out-with-investors/03.webp` | 792 KB | 373 KB |
| `/images/blog/out-of-office-phitopolis-summer-2026/02.png` | `/images/blog/out-of-office-phitopolis-summer-2026/02.webp` | 232 KB | 101 KB |
| `/images/blog/out-of-office-phitopolis-summer-2026/03.png` | `/images/blog/out-of-office-phitopolis-summer-2026/03.webp` | 1258 KB | 116 KB |
| `/images/blog/out-of-office-phitopolis-summer-2026/04.png` | `/images/blog/out-of-office-phitopolis-summer-2026/04.webp` | 1290 KB | 116 KB |
| `/images/blog/out-of-office-phitopolis-summer-2026/05.png` | `/images/blog/out-of-office-phitopolis-summer-2026/05.webp` | 338 KB | 131 KB |
| `/images/blog/phitopolis-datathon-2k25-the-grads-all-star-showdown/01.jpg` | `/images/blog/phitopolis-datathon-2k25-the-grads-all-star-showdown/01.webp` | 94 KB | 68 KB |
| `/images/blog/phitopolis-datathon-2k25-the-grads-all-star-showdown/02.jpg` | `/images/blog/phitopolis-datathon-2k25-the-grads-all-star-showdown/02.webp` | 87 KB | 62 KB |
| `/images/blog/phitopolis-datathon-2k25-the-grads-all-star-showdown/03.jpg` | `/images/blog/phitopolis-datathon-2k25-the-grads-all-star-showdown/03.webp` | 111 KB | 76 KB |
| `/images/blog/phitopolis-external-talk/01.jpg` | `/images/blog/phitopolis-external-talk/01.webp` | 179 KB | 147 KB |
| `/images/blog/phitopolis-wellness-week-2025/01.jpg` | `/images/blog/phitopolis-wellness-week-2025/01.webp` | 146 KB | 116 KB |
| `/images/blog/phitopolis-wellness-week-2025/02.jpg` | `/images/blog/phitopolis-wellness-week-2025/02.webp` | 112 KB | 80 KB |
| `/images/blog/phitopolis-wellness-week-2025/03.jpg` | `/images/blog/phitopolis-wellness-week-2025/03.webp` | 115 KB | 88 KB |
| `/images/blog/phitopolis-wellness-week-2025/04.jpg` | `/images/blog/phitopolis-wellness-week-2025/04.webp` | 173 KB | 141 KB |
| `/images/blog/phitopolis-wellness-week-2025/05.jpg` | `/images/blog/phitopolis-wellness-week-2025/05.webp` | 123 KB | 96 KB |
| `/images/blog/phitopolis-wellness-week-2025/06.jpg` | `/images/blog/phitopolis-wellness-week-2025/06.webp` | 151 KB | 121 KB |
| `/images/blog/phitopolis-wellness-week-2025/07.jpg` | `/images/blog/phitopolis-wellness-week-2025/07.webp` | 116 KB | 83 KB |
| `/images/blog/phitopolis-wellness-week-2025/08.jpg` | `/images/blog/phitopolis-wellness-week-2025/08.webp` | 122 KB | 96 KB |
| `/images/blog/phitopolis-wellness-week-2025/09.jpg` | `/images/blog/phitopolis-wellness-week-2025/09.webp` | 148 KB | 117 KB |
| `/images/blog/phitopolis-wellness-week-2025/10.jpg` | `/images/blog/phitopolis-wellness-week-2025/10.webp` | 131 KB | 101 KB |
| `/images/blog/phitopolis-wellness-week-2025/11.jpg` | `/images/blog/phitopolis-wellness-week-2025/11.webp` | 91 KB | 77 KB |
| `/images/blog/quants-in-the-wild/01.png` | `/images/blog/quants-in-the-wild/01.webp` | 86 KB | 69 KB |
| `/images/blog/ready-set-school-brigada-eskwela-at-pembo-elementary-school/01.jpg` | `/images/blog/ready-set-school-brigada-eskwela-at-pembo-elementary-school/01.webp` | 119 KB | 106 KB |
| `/images/blog/ready-set-school-brigada-eskwela-at-pembo-elementary-school/02.jpg` | `/images/blog/ready-set-school-brigada-eskwela-at-pembo-elementary-school/02.webp` | 170 KB | 167 KB |
| `/images/blog/ready-set-school-brigada-eskwela-at-pembo-elementary-school/03.jpg` | `/images/blog/ready-set-school-brigada-eskwela-at-pembo-elementary-school/03.webp` | 109 KB | 91 KB |
| `/images/blog/riding-into-our-6th-year-phitopolis-wild-west-anniversary-celebration/01.png` | `/images/blog/riding-into-our-6th-year-phitopolis-wild-west-anniversary-celebration/01.webp` | 427 KB | 154 KB |
| `/images/blog/riding-into-our-6th-year-phitopolis-wild-west-anniversary-celebration/02.png` | `/images/blog/riding-into-our-6th-year-phitopolis-wild-west-anniversary-celebration/02.webp` | 333 KB | 125 KB |
| `/images/blog/riding-into-our-6th-year-phitopolis-wild-west-anniversary-celebration/03.png` | `/images/blog/riding-into-our-6th-year-phitopolis-wild-west-anniversary-celebration/03.webp` | 343 KB | 127 KB |
| `/images/blog/riding-into-our-6th-year-phitopolis-wild-west-anniversary-celebration/04.png` | `/images/blog/riding-into-our-6th-year-phitopolis-wild-west-anniversary-celebration/04.webp` | 279 KB | 129 KB |
| `/images/blog/riding-into-our-6th-year-phitopolis-wild-west-anniversary-celebration/05.png` | `/images/blog/riding-into-our-6th-year-phitopolis-wild-west-anniversary-celebration/05.webp` | 421 KB | 171 KB |
| `/images/blog/riding-into-our-6th-year-phitopolis-wild-west-anniversary-celebration/06.png` | `/images/blog/riding-into-our-6th-year-phitopolis-wild-west-anniversary-celebration/06.webp` | 237 KB | 72 KB |
| `/images/blog/riding-into-our-6th-year-phitopolis-wild-west-anniversary-celebration/07.jpg` | `/images/blog/riding-into-our-6th-year-phitopolis-wild-west-anniversary-celebration/07.webp` | 172 KB | 156 KB |
| `/images/blog/shrinath-in-bohol-the-quants-stroll-with-adventures-to-unroll/01.jpg` | `/images/blog/shrinath-in-bohol-the-quants-stroll-with-adventures-to-unroll/01.webp` | 141 KB | 120 KB |
| `/images/blog/shrinath-in-bohol-the-quants-stroll-with-adventures-to-unroll/02.png` | `/images/blog/shrinath-in-bohol-the-quants-stroll-with-adventures-to-unroll/02.webp` | 671 KB | 151 KB |
| `/images/blog/shrinath-in-bohol-the-quants-stroll-with-adventures-to-unroll/03.jpg` | `/images/blog/shrinath-in-bohol-the-quants-stroll-with-adventures-to-unroll/03.webp` | 90 KB | 82 KB |
| `/images/blog/shrinath-in-bohol-the-quants-stroll-with-adventures-to-unroll/04.jpg` | `/images/blog/shrinath-in-bohol-the-quants-stroll-with-adventures-to-unroll/04.webp` | 171 KB | 161 KB |
| `/images/blog/shrinath-in-bohol-the-quants-stroll-with-adventures-to-unroll/07.jpg` | `/images/blog/shrinath-in-bohol-the-quants-stroll-with-adventures-to-unroll/07.webp` | 298 KB | 260 KB |
| `/images/blog/sunshine-stories-and-school-kits-a-csr-day-to-remember/01.jpg` | `/images/blog/sunshine-stories-and-school-kits-a-csr-day-to-remember/01.webp` | 258 KB | 244 KB |
| `/images/blog/sunshine-stories-and-school-kits-a-csr-day-to-remember/02.jpg` | `/images/blog/sunshine-stories-and-school-kits-a-csr-day-to-remember/02.webp` | 215 KB | 199 KB |
