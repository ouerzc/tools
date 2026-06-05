export const messages = {
  "zh-CN": {
    app: {
      meta: {
        title: "DevKit Hub {'|'} 在线开发工具集合"
      },
      skipLink: "跳到主要内容",
      brandHome: "DevKit Hub 首页",
      nav: {
        aria: "主导航",
        tools: "工具"
      },
      theme: {
        toLight: "切换到白色主题",
        toDark: "切换到黑色主题"
      },
      sidebar: {
        collapse: "收起侧边栏",
        expand: "展开侧边栏"
      },
      locale: {
        label: "语言",
        ariaLabel: "语言",
        title: "切换语言",
        zh: "中文",
        en: "English"
      },
      home: {
        badge: "Local-first toolkit",
        title: "开发工具",
        count: "{shown} / {total} tools",
        searchPlaceholder: "搜索 JSON、diff、timestamp...",
        copyEntry: "复制入口",
        tagsAria: "常用标签",
        toolsAria: "工具入口",
        openTool: "打开工具",
        noMatches: "没有匹配工具。"
      },
      workspace: {
        back: "返回工具集合",
        copyEntry: "复制入口"
      },
      toast: {
        entryCopied: "已复制入口",
        copyBlocked: "浏览器限制了复制权限"
      },
      footer: "DevKit Hub"
    },
    toolMeta: {
      jsonDiff: {
        title: "JSON Diff",
        description: "比较字段变更。",
        longDescription: "按稳定字段路径输出新增、删除和变更，并提供左右两侧语义高亮。",
        kind: "compare",
        keywords: "JSON Diff 差异 对比 compare object field path"
      },
      jsonFormat: {
        title: "JSON 格式化",
        description: "展开或压缩 JSON。",
        longDescription: "把压缩 JSON 格式化为可读缩进，或压缩成适合接口传输的单行。",
        kind: "format",
        keywords: "JSON 格式化 format minify pretty beautify"
      },
      timestamp: {
        title: "时间戳转换",
        description: "秒、毫秒、日期互转。",
        longDescription: "Unix 时间戳、日期时间和常用时区互转，并提供开发常用复制值。",
        kind: "time",
        keywords: "时间戳 timestamp unix date time timezone 时区"
      }
    },
    common: {
      waiting: "等待输入",
      jsonValid: "JSON 有效",
      formatted: "已格式化显示",
      copyBlocked: "浏览器限制了复制权限",
      copy: "复制"
    },
    tools: {
      jsonDiff: {
        badge: "Semantic Diff",
        title: "JSON Diff",
        description: "比较两个 JSON 值，按字段路径输出新增、删除和变更。",
        fillSample: "填入示例",
        compare: "比较",
        inputAria: "JSON 输入",
        leftJson: "左侧 JSON",
        rightJson: "右侧 JSON",
        format: "格式化",
        initialResult: "粘贴两段 JSON 后点击比较。",
        noFieldDiff: "两个 JSON 没有字段级差异。",
        fixJsonErrors: "请先修正输入中的 JSON 错误。",
        copied: "已复制差异",
        resultTitle: "差异结果",
        copyResult: "复制结果",
        summary: "总差异 {total}，新增 {added}，删除 {removed}，变更 {changed}",
        total: "总差异 {count}",
        added: "新增 {count}",
        removed: "删除 {count}",
        changed: "变更 {count}",
        leftFormatted: "左侧格式化 JSON",
        rightFormatted: "右侧格式化 JSON"
      },
      jsonFormat: {
        badge: "Formatter",
        title: "JSON 格式化",
        description: "粘贴 JSON，选择缩进后格式化；也可以压缩成适合接口传输的单行。",
        fillSample: "填入示例",
        format: "格式化",
        panelTitle: "输入 / 输出",
        status: {
          minified: "已压缩成单行",
          formatted: "已格式化为 {count} 空格缩进"
        },
        copied: "已复制结果",
        indent: "缩进",
        twoSpaces: "2 空格缩进",
        fourSpaces: "4 空格缩进",
        minifyOption: "压缩成单行",
        minify: "压缩",
        copyResult: "复制结果",
        lines: "行数",
        bytes: "字节",
        mode: "模式",
        singleLine: "单行",
        spaces: "{count} 空格"
      },
      timestamp: {
        badge: "Unix Time",
        title: "时间戳转换",
        description: "秒、毫秒、日期和时区互转。常用值可直接复制。",
        clear: "清空",
        convert: "转换",
        gridAria: "时间戳转换工具",
        input: "输入",
        inputModeAria: "互斥输入方式",
        timestampToDate: "时间戳转日期",
        secondsOrMilliseconds: "秒或毫秒",
        unixTimestamp: "Unix 时间戳",
        timestampPlaceholder: "1718006400 或 1718006400000",
        or: "或",
        dateToTimestamp: "日期转时间戳",
        dateWithZone: "日期时间 + 城市 UTC 偏移",
        dateTime: "日期时间",
        inputZone: "输入时区",
        displayZone: "显示时区",
        quickActions: "快捷入口",
        quick: {
          now: "当前时间",
          today: "今天 00:00",
          tomorrow: "明天 00:00",
          week: "一周后"
        },
        resultTitle: "转换结果",
        extraAria: "额外时间功能",
        history: {
          title: "转换历史",
          empty: "暂无转换记录",
          seconds: "{value} 秒",
          milliseconds: "{value} 毫秒",
          recorded: "{value} 记录"
        },
        devCommon: {
          title: "开发常用",
          seconds: "当前秒级时间戳：",
          milliseconds: "当前毫秒时间戳：",
          localZone: "当前本地时区：",
          offset: "显示 UTC 偏移："
        },
        rows: {
          seconds: "Unix 秒",
          milliseconds: "Unix 毫秒",
          zoned: "显示时区",
          utc: "UTC",
          iso: "ISO 8601",
          relative: "相对时间",
          weekday: "星期",
          week: "周数",
          dayOfYear: "年内第几天"
        },
        status: {
          calculating: "计算中",
          converted: "已转换",
          invalidTimestamp: "时间戳格式无效",
          invalidTime: "请输入有效时间",
          notConverted: "未转换"
        },
        source: {
          manual: "手动转换",
          timestamp: "时间戳 {value}",
          date: "日期 {value} {zone}",
          displayZone: "显示时区 {zone}",
          initial: "初始时间"
        },
        copied: "已复制"
      }
    },
    timestamp: {
      weekdays: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
      relative: {
        justNow: "刚刚",
        future: "{amount} {unit}后",
        past: "{amount} {unit}前",
        units: {
          year: "年",
          month: "月",
          day: "天",
          hour: "小时",
          minute: "分钟",
          second: "秒"
        }
      },
      week: "ISO 第 {week} 周",
      dayOfYear: "第 {day} 天"
    }
  },
  "en-US": {
    app: {
      meta: {
        title: "DevKit Hub {'|'} Online Developer Toolkit"
      },
      skipLink: "Skip to main content",
      brandHome: "DevKit Hub Home",
      nav: {
        aria: "Primary navigation",
        tools: "Tools"
      },
      theme: {
        toLight: "Switch to light theme",
        toDark: "Switch to dark theme"
      },
      sidebar: {
        collapse: "Collapse sidebar",
        expand: "Expand sidebar"
      },
      locale: {
        label: "Language",
        ariaLabel: "Language",
        title: "Change language",
        zh: "中文",
        en: "English"
      },
      home: {
        badge: "Local-first toolkit",
        title: "Developer Tools",
        count: "{shown} / {total} tools",
        searchPlaceholder: "Search JSON, diff, timestamp...",
        copyEntry: "Copy entry",
        tagsAria: "Common tags",
        toolsAria: "Tool entries",
        openTool: "Open tool",
        noMatches: "No matching tools."
      },
      workspace: {
        back: "Back to tools",
        copyEntry: "Copy entry"
      },
      toast: {
        entryCopied: "Entry copied",
        copyBlocked: "Browser blocked clipboard access"
      },
      footer: "DevKit Hub"
    },
    toolMeta: {
      jsonDiff: {
        title: "JSON Diff",
        description: "Compare field changes.",
        longDescription: "Compare stable field paths for added, removed, and changed values with semantic highlighting on both sides.",
        kind: "compare",
        keywords: "JSON Diff difference compare object field path changes semantic"
      },
      jsonFormat: {
        title: "JSON Formatter",
        description: "Pretty-print or minify JSON.",
        longDescription: "Format compact JSON with readable indentation, or minify it into a single line for API transport.",
        kind: "format",
        keywords: "JSON formatter format minify pretty beautify readable indentation compact"
      },
      timestamp: {
        title: "Timestamp Converter",
        description: "Convert seconds, milliseconds, and dates.",
        longDescription: "Convert Unix timestamps, date-time values, and common UTC offsets with copy-ready developer values.",
        kind: "time",
        keywords: "timestamp converter unix date time timezone UTC offset milliseconds seconds"
      }
    },
    common: {
      waiting: "Waiting for input",
      jsonValid: "Valid JSON",
      formatted: "Formatted",
      copyBlocked: "Browser blocked clipboard access",
      copy: "Copy"
    },
    tools: {
      jsonDiff: {
        badge: "Semantic Diff",
        title: "JSON Diff",
        description: "Compare two JSON values and list added, removed, and changed fields by path.",
        fillSample: "Fill sample",
        compare: "Compare",
        inputAria: "JSON input",
        leftJson: "Left JSON",
        rightJson: "Right JSON",
        format: "Format",
        initialResult: "Paste two JSON values, then compare.",
        noFieldDiff: "No field-level differences found.",
        fixJsonErrors: "Fix JSON errors before comparing.",
        copied: "Diff copied",
        resultTitle: "Diff result",
        copyResult: "Copy result",
        summary: "{total} total, {added} added, {removed} removed, {changed} changed",
        total: "{count} total",
        added: "{count} added",
        removed: "{count} removed",
        changed: "{count} changed",
        leftFormatted: "Formatted left JSON",
        rightFormatted: "Formatted right JSON"
      },
      jsonFormat: {
        badge: "Formatter",
        title: "JSON Formatter",
        description: "Paste JSON, choose indentation, then format it; or minify it into one API-ready line.",
        fillSample: "Fill sample",
        format: "Format",
        panelTitle: "Input / Output",
        status: {
          minified: "Minified to one line",
          formatted: "Formatted with {count}-space indentation"
        },
        copied: "Result copied",
        indent: "Indentation",
        twoSpaces: "2-space indentation",
        fourSpaces: "4-space indentation",
        minifyOption: "Minify to one line",
        minify: "Minify",
        copyResult: "Copy result",
        lines: "Lines",
        bytes: "Bytes",
        mode: "Mode",
        singleLine: "Single line",
        spaces: "{count} spaces"
      },
      timestamp: {
        badge: "Unix Time",
        title: "Timestamp Converter",
        description: "Convert seconds, milliseconds, dates, and UTC offsets. Copy common developer values directly.",
        clear: "Clear",
        convert: "Convert",
        gridAria: "Timestamp converter",
        input: "Input",
        inputModeAria: "Mutually exclusive input modes",
        timestampToDate: "Timestamp to date",
        secondsOrMilliseconds: "Seconds or milliseconds",
        unixTimestamp: "Unix timestamp",
        timestampPlaceholder: "1718006400 or 1718006400000",
        or: "or",
        dateToTimestamp: "Date to timestamp",
        dateWithZone: "Date-time + city UTC offset",
        dateTime: "Date-time",
        inputZone: "Input zone",
        displayZone: "Display zone",
        quickActions: "Quick actions",
        quick: {
          now: "Current time",
          today: "Today 00:00",
          tomorrow: "Tomorrow 00:00",
          week: "One week later"
        },
        resultTitle: "Conversion result",
        extraAria: "Extra time tools",
        history: {
          title: "Conversion history",
          empty: "No conversion records",
          seconds: "{value} sec",
          milliseconds: "{value} ms",
          recorded: "{value} recorded"
        },
        devCommon: {
          title: "Developer values",
          seconds: "Current seconds timestamp: ",
          milliseconds: "Current milliseconds timestamp: ",
          localZone: "Current local zone: ",
          offset: "Display UTC offset: "
        },
        rows: {
          seconds: "Unix seconds",
          milliseconds: "Unix milliseconds",
          zoned: "Display zone",
          utc: "UTC",
          iso: "ISO 8601",
          relative: "Relative time",
          weekday: "Weekday",
          week: "Week number",
          dayOfYear: "Day of year"
        },
        status: {
          calculating: "Calculating",
          converted: "Converted",
          invalidTimestamp: "Invalid timestamp format",
          invalidTime: "Enter a valid time",
          notConverted: "Not converted"
        },
        source: {
          manual: "Manual conversion",
          timestamp: "Timestamp {value}",
          date: "Date {value} {zone}",
          displayZone: "Display zone {zone}",
          initial: "Initial time"
        },
        copied: "Copied"
      }
    },
    timestamp: {
      weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      relative: {
        justNow: "just now",
        future: "in {amount} {unit}",
        past: "{amount} {unit} ago",
        units: {
          year: "year",
          month: "month",
          day: "day",
          hour: "hour",
          minute: "minute",
          second: "second"
        }
      },
      week: "ISO week {week}",
      dayOfYear: "day {day}"
    }
  }
} as const;

export type MessageSchema = typeof messages["zh-CN"];
