#!/usr/bin/env bash
#
# دریافت اصلاحات (amendments) از مخزن
# Usage: ./get-amendments.sh [--format table|json|yaml] [--environment local|staging|production]
#

set -euo pipefail

# مسیر پایه پروژه (Windows: D:\platform-forge)
PROJECT_ROOT="/mnt/d/platform-forge"
AMENDMENTS_FILE="$PROJECT_ROOT/handbook/60-delivery/amendments.yaml"

# پیش‌فرض‌ها
FORMAT="table"
ENVIRONMENT="local"

# پارس کردن آرگومان‌ها
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--format)
            FORMAT="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [-f|--format table|json|yaml] [-e|--environment local|staging|production]"
            exit 0
            ;;
        *)
            echo "❌ گزینه ناشناخته: $1"
            exit 1
            ;;
    esac
done

echo ""
echo -e "\033[1;36m=== دریافت اصلاحات (Amendments) ===\033[0m"
echo -e "\033[90mمحیط: $ENVIRONMENT\033[0m"
echo ""

# بررسی وجود فایل
if [[ ! -f "$AMENDMENTS_FILE" ]]; then
    echo -e "\033[33m⚠️  فایل amendments.yaml یافت نشد\033[0m"
    echo "   مسیر: $AMENDMENTS_FILE"
    
    # ایجاد پوشه و فایل نمونه
    mkdir -p "$(dirname "$AMENDMENTS_FILE")"
    
    cat > "$AMENDMENTS_FILE" << 'EOF'
sprints:
  - name: Sprint 3 (P-IDENTITY)
    amendments:
      - id: AMEND-001
        title: افزودن MFA با TOTP
        status: completed
        priority: P1
      - id: AMEND-002
        title: بهبود backup codes
        status: pending
        priority: P2
      - id: AMEND-003
        title: تست MFA flow
        status: pending
        priority: P1

  - name: Sprint 4 (Tenancy)
    amendments:
      - id: AMEND-004
        title: ایجاد tenant جدید
        status: pending
        priority: P0
      - id: AMEND-005
        title: مدیریت membership
        status: pending
        priority: P1
EOF
    
    echo -e "\033[32m✓ فایل نمونه ایجاد شد\033[0m"
    echo ""
fi

# خواندن و نمایش بر اساس فرمت
case "$FORMAT" in
    table)
        echo -e "\033[1;34m┌─────────────────────────────────────────────────────────────────┐\033[0m"
        echo -e "\033[1;34m│\033[0m Sprint                      ID          Title           Status   \033[1;34m│\033[0m"
        echo -e "\033[1;34m├─────────────────────────────────────────────────────────────────┤\033[0m"
        
        while IFS= read -r line; do
            # استخراج داده‌ها
            if [[ "$line" =~ ^[[:space:]]*-\ name:\ (.+)$ ]]; then
                current_sprint="${BASH_REMATCH[1]}"
            elif [[ "$line" =~ ^[[:space:]]*-\ id:\ (.+)$ ]]; then
                current_id="${BASH_REMATCH[1]}"
            elif [[ "$line" =~ ^[[:space:]]*title:\ (.+)$ ]]; then
                current_title="${BASH_REMATCH[1]}"
            elif [[ "$line" =~ ^[[:space:]]*status:\ (.+)$ ]]; then
                current_status="${BASH_REMATCH[1]}"
                # نمایش ردیف
                status_color=""
                case "$current_status" in
                    completed) status_color="\033[32m✓\033[0m" ;;
                    pending)  status_color="\033[33m⏳\033[0m" ;;
                    in_progress) status_color="\033[34m🔄\033[0m" ;;
                esac
                printf "\033[1;34m│\033[0m %-26s \033[1;34m│\033[0m %-10s \033[1;34m│\033[0m %-18s \033[1;34m│\033[0m %s \n" \
                    "${current_sprint:0:26}" "$current_id" "${current_title:0:18}" "$status_color"
            fi
        done < "$AMENDMENTS_FILE"
        
        echo -e "\033[1;34m└─────────────────────────────────────────────────────────────────┘\033[0m"
        ;;
        
    json)
        # تبدیل به JSON ساده
        echo "{"
        echo '  "sprints": ['
        first_sprint=true
        while IFS= read -r line; do
            if [[ "$line" =~ ^[[:space:]]*-\ name:\ (.+)$ ]]; then
                if [[ "$first_sprint" == false ]]; then
                    echo "      ],"
                    echo "    },"
                fi
                first_sprint=false
                echo "    {"
                echo "      \"name\": \"${BASH_REMATCH[1]}\","
                echo "      \"amendments\": ["
            elif [[ "$line" =~ ^[[:space:]]*-\ id:\ (.+)$ ]]; then
                echo -n '        {"id": "'"${BASH_REMATCH[1]}"'"'
            elif [[ "$line" =~ ^[[:space:]]*title:\ (.+)$ ]]; then
                echo ', "title": "'"${BASH_REMATCH[1]}"'"'
            elif [[ "$line" =~ ^[[:space:]]*status:\ (.+)$ ]]; then
                echo ', "status": "'"${BASH_REMATCH[1]}"'"}'
            fi
        done < "$AMENDMENTS_FILE"
        echo "      ]"
        echo "    }"
        echo "  ]"
        echo "}"
        ;;
        
    yaml)
        cat "$AMENDMENTS_FILE"
        ;;
esac

# آمار
total=$(grep -c "id:" "$AMENDMENTS_FILE" || echo 0)
completed=$(grep -c "status: completed" "$AMENDMENTS_FILE" || echo 0)
pending=$((total - completed))

echo ""
echo -e "\033[1;36m--- خلاصه ---\033[0m"
echo "تعداد کل اصلاحات: $total"
echo -e "تکمیل شده: \033[32m$completed\033[0m"
echo -e "در انتظار: \033[33m$pending\033[0m"
echo ""
