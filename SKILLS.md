# DSH Skills Aggregate

Auto-generated catalogue of the skills published by this repository. Do not edit
by hand — `scripts/build.mjs` rewrites it on every build.

- Generated: `2026-10-12T10:57:59.362Z`
- Skills: **72** (panel limit 500)
- Payload: **17.83 MiB** / 32 MiB panel cap

## Add it to DSH

```text
Settings → Skills → Skill repositories → Add repository
  <owner>/<repo>
```

## Sources

| Upstream | Ref | Category | License |
| --- | --- | --- | --- |
| [anthropics/skills](https://github.com/anthropics/skills) | `main` | official | see upstream (Anthropic Agent Skills) |
| [LeastBit/Anthropics_skills_zh-CN](https://github.com/LeastBit/Anthropics_skills_zh-CN) | `main` | official-zh | see upstream |
| [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub) | `mine` | community-cn | see upstream |

## Skills

### community-cn

| Skill | Description | Source |
| --- | --- | --- |
| `adaptive-quality-gate` | Use when work produces a deliverable, factual claim, dataset, code change, decision, publication, deployment, automation, or irreversible ac | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/01-agent-engineering/adaptive-quality-gate) |
| `bioc-fulltext-fetch` | 从 PubMed/PMC 论文取结构化全文并按章节切分为 RAG 友好的 chunk。当用户需要批量抽取论文全文、按 Methods/Results 等章节分段、提取表格上下文、构建文献向量库时，使用本 skill。支持 PMID（标题+摘要）和 PMCID（全文，开放获取子集） | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/06-data-search/bioc-fulltext-fetch) |
| `citation-anchor-resolver` | \| | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/10-business-industry/citation-anchor-resolver) |
| `cite-bound-content-generator` | Phase 4 Turn 1 of disease-market-sizing-orchestration. Generates report HTML with mandatory citation anchors per fact claim. Reads contract  | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/10-business-industry/cite-bound-content-generator) |
| `clinical-trials-v2` | Use this skill whenever the user asks about clinical trial status, recruitment, trial phases (1-4), outcomes, trial registries, NCT IDs, or  | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/06-data-search/clinical-trials-v2) |
| `cn-clinical-guidelines-fetch` | 抓中国权威医学指南正文（CSCO / NCCN 中文版 / NMPA / CDE / NHC）并返回结构化"治疗推荐表"。当用户做中国市场的疾病调研、需要 I 级证据来源、或需要交叉验证治疗方案推荐是否符合 CSCO 指南时使用。v2 (2026-04-26)：Cite-or-B | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/06-data-search/cn-clinical-guidelines-fetch) |
| `content-verification-layer` | Phase 4 Turn 2 of disease-market-sizing-orchestration (A6' upgrade). Audits compose output via Cite-or-Block strict — every anchor must reve | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/10-business-industry/content-verification-layer) |
| `contract-elicitor` | Use FIRST when user requests any disease market sizing report (e.g. "做 X 市场调研" / "Run market sizing for X"). Elicits 4-6 startup questions ( | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/10-business-industry/contract-elicitor) |
| `contract-review` | 合同审核技能,通过添加基于评论的问题标注而不改变原始文本。执行三层审核(基础、业务、法律),编写结构化评论(问题类型、风险原因、修订建议),风险等级通过审核人姓名编码,并生成合同摘要、综合意见和Mermaid业务流程图(含渲染图像)。输出语言必须遵循合同的语言。 | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/10-business-industry/contract-review) |
| `creating-financial-models` | 高级财务建模套件，包含DCF估值、敏感性分析、蒙特卡洛模拟和场景规划。当用户需要对企业、项目或并购交易进行投资分析、股权估值、IRR/MOIC计算、WACC建模，或要求建立DCF模型、运行概率模拟、制作敏感性表格时，请主动使用此技能。 | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/10-business-industry/creating-financial-models) |
| `data-scraper-agent` | Build a fully automated AI-powered data collection agent for any public source — job boards, prices, news, GitHub, sports, anything. Scrapes | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/06-data-search/data-scraper-agent) |
| `decision-tree-with-lp-embedding` | > | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/08-writing-marketing/decision-tree-with-lp-embedding) |
| `deep-research` | Multi-source deep research using firecrawl and exa MCPs. Searches the web, synthesizes findings, and delivers cited reports with source attr | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/01-agent-engineering/deep-research) |
| `design-system-injector` | Phase 5 part of disease-market-sizing-orchestration. Injects consulting palette (navy/gold/blue) + base CSS + floating TOC + section divider | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/10-business-industry/design-system-injector) |
| `disease-market-sizing-html-template` | > | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/10-business-industry/disease-market-sizing-html-template) |
| `disease-market-sizing-orchestration` | Cross-disease market sizing entry skill. Triggered by user one-liner like "做 X 市场调研" or "Run market sizing for X". Auto-runs 5 phase pipelin | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/10-business-industry/disease-market-sizing-orchestration) |
| `disease-stratifier` | Phase 2 of disease-market-sizing-orchestration. Discovers disease-specific stratification dimensions by citing guideline sections from sourc | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/10-business-industry/disease-stratifier) |
| `drug-citation-verifier` | Cite-or-Block 架构下的药名 cross-check 原子 skill。给定报告文本与 .cache/<slug>/sources/,扫描每个药品提及 → 找最近 citation 锚点 → 核对锚点指向的源里是否真的提到了此药(通用名 + 商品名)。无字典、无 fa | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/10-business-industry/drug-citation-verifier) |
| `europepmc-search` | 多源文献聚合检索：PubMed + PMC + 预印本（bioRxiv / medRxiv / ChemRxiv / Research Square）+ NCBI Bookshelf + 专利 一次调用，自动 PMID/PMCID/DOI 三级去重。用于医学 RAG 知识库广召回 | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/06-data-search/europepmc-search) |
| `evidence-appendix-sync` | > | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/06-data-search/evidence-appendix-sync) |
| `find-skills` | Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/01-agent-engineering/find-skills) |
| `github-readme-visuals` | Create or refresh original product hero images, interface screenshots, and image-led README sections for GitHub repositories. Use when a use | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/07-media-content/github-readme-visuals) |
| `github-repo-seo-standard` | Use when auditing, planning, measuring, or implementing GitHub repository discoverability work, including README/README_zh SEO review, Descr | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/08-writing-marketing/github-repo-seo-standard) |
| `github-seo-evaluation-loop` | Use when running recurring GitHub repository SEO evaluation, comparing broad Chinese search visibility over time, producing metrics evidence | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/08-writing-marketing/github-seo-evaluation-loop) |
| `healthcare-cdss-patterns` | Clinical Decision Support System (CDSS) development patterns. Drug interaction checking, dose validation, clinical scoring (NEWS2, qSOFA), a | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/10-business-industry/healthcare-cdss-patterns) |
| `healthcare-emr-patterns` | EMR/EHR development patterns for healthcare applications. Clinical safety, encounter workflows, prescription generation, clinical decision s | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/10-business-industry/healthcare-emr-patterns) |
| `healthcare-eval-harness` | Patient safety evaluation harness for healthcare application deployments. Automated test suites for CDSS accuracy, PHI exposure, clinical wo | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/10-business-industry/healthcare-eval-harness) |
| `healthcare-phi-compliance` | Protected Health Information (PHI) and Personally Identifiable Information (PII) compliance patterns for healthcare applications. Covers dat | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/10-business-industry/healthcare-phi-compliance) |
| `html-design-polish` | 网页需要产品清晰度、信息层级、响应式或视觉系统美化、重设计或设计审计时使用。 | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/07-media-content/html-design-polish) |
| `ifi-market-sizing-skill` | > | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/10-business-industry/ifi-market-sizing-skill) |
| `imagegen` | Generate or edit raster images when the task benefits from AI-created bitmap visuals such as photos, illustrations, textures, sprites, mocku | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/07-media-content/imagegen) |
| `jianying-editor` | 剪映 (JianYing) AI自动化剪辑的高级封装 API (JyWrapper)，提供开箱即用的 Python 接口，支持录屏、素材导入、字幕生成、Web 动效合成及项目导出。全面适配 MacOS (Apple Silicon/Intel) 与 Windows，支持 v5.9 | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/07-media-content/jianying-editor) |
| `liquid-glass-design` | iOS 26 Liquid Glass design system — dynamic glass material with blur, reflection, and interactive morphing for SwiftUI, UIKit, and WidgetKit | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/02-coding-languages/swift/liquid-glass-design) |
| `market-research-reports` | Generate 50+ page professional market research reports with consulting-firm quality (McKinsey, BCG, Gartner style). Includes Porter's Five F | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/06-data-search/market-research-reports) |
| `market-sizing-mece-foundation` | > | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/06-data-search/market-sizing-mece-foundation) |
| `medical-evidence-grading` | Medical evidence grading orchestrator. 当用户需要评估医学文献的证据强度、比较多篇论文的质量、查找某疾病的高等级证据(指南或 RCT)、或验证临床声明的证据支持度时,调用本 skill。整合 6 个原子 skill 的检索结果,按证据金字塔自 | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/06-data-search/medical-evidence-grading) |
| `medical-research` | Retrieves scientific papers from PubMed and creates plain-language research summaries. Use when users ask about medical research, scientific | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/06-data-search/medical-research) |
| `netlify-cli` | 使用 Netlify CLI 完成安装、认证、站点关联、本地开发、环境变量管理与部署。 | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/03-frameworks/netlify-cli) |
| `nmpa-drug-registry-lookup` | 中国药品权威数据库查询 — NMPA(国家药监局) + CDE(药品审评中心) + DrugBank(英文名/ATC) + PubChem(化学结构) 多源融合,提供(通用名 ↔ 商品名 ↔ 英文名 ↔ 适应症 ↔ NMPA 批文号 ↔ 上市日期)精确映射。Make sure t | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/06-data-search/nmpa-drug-registry-lookup) |
| `ppt-nano` | 白板板书风格 PPT 生成。用户说「做PPT」「生成幻灯片」「白板风格演示」「板书」等时使用。支持 5 步标准工作流：确认风格→整理页码→检查依赖→逐页生成→合成下载。输出高保真白板照片，手写感 shufa 笔触，黑/蓝/红三色马克笔，适合教学、汇报、头脑风暴。每页需参考图和提示 | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/07-media-content/ppt-nano) |
| `project-cleanup-audit` | Audit and safely clean local project repositories or workspaces with excessive generated files, old project residue, dirty Git status, stale | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/01-agent-engineering/project-cleanup-audit) |
| `pubmed-eutils` | Search PubMed and retrieve structured biomedical literature with PMID lists, abstracts, MeSH terms, publication types, and PMC IDs for full- | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/06-data-search/pubmed-eutils) |
| `pubmed-search` | Search PubMed biomedical literature with natural language queries powered by Valyu semantic search. Full-text access, integrate into your AI | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/06-data-search/pubmed-search) |
| `pubtator-entity-search` | NLM PubTator3 实体级关系挖掘原子 skill — 在 PubMed 文献里检索"疾病-药物-基因-化学品-突变-物种-细胞系"的标注与关系三元组。当用户问"BTK 与肺曲霉病的关联文献"、"BTK 抑制剂(MeSH D000077180)在哪些研究被讨论"、"标注这 | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/06-data-search/pubtator-entity-search) |
| `remotion-video-creation` | Best practices for Remotion - Video creation in React. 29 domain-specific rules covering 3D, animations, audio, captions, charts, transition | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/07-media-content/remotion-video-creation) |
| `report-bundle-builder` | > | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/06-data-search/report-bundle-builder) |
| `santa-method` | Multi-agent adversarial verification with convergence loop. Two independent review agents must both pass before output ships. | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/01-agent-engineering/santa-method) |
| `session-resume` | Mid-run failure recovery for disease-market-sizing-orchestration. Inspects .cache/<slug>/ to determine which phase last completed and which  | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/10-business-industry/session-resume) |
| `skill-lifecycle-manager` | Manage agent-skill lifecycles across local, global, project, Skill Hub, skills.sh, GitHub, plugin-cache, and system roots. Use when searchin | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/01-agent-engineering/skill-lifecycle-manager) |
| `wechat-article` | WeChat article creator with Fu Sheng's writing style - conversational, story-driven, opinionated. Use this skill whenever the user mentions  | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/07-media-content/wechat-article) |
| `xhs-pharma-social-listening` | Run evidence-disciplined Xiaohongshu social listening for foreign pharma employee pain points. Use when the user asks to collect and analyze | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/10-business-industry/xhs-pharma-social-listening) |
| `yq-article-style-imitation` | Use when asked to study any writer or author, imitate article style, directly mimic a living or historical writer's prose style when request | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/08-writing-marketing/yq-article-style-imitation) |
| `yq-editorial-presentation-html` | 可变体的 warm editorial 演示设计系统，用于 presentation、case sharing、项目汇报、战略叙事和产品发布。支持横向全屏 HTML deck 与程序化 PPTX，通过 style profile、语义 slide manifest、构图新颖度规划 | [lubiny0601-spec/Skill-hub](https://github.com/lubiny0601-spec/Skill-hub/tree/mine/skills/07-media-content/yq-editorial-presentation-html) |

### official

| Skill | Description | Source |
| --- | --- | --- |
| `academy-guide` | > | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/academy-guide) |
| `claude-api` | \|- | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/claude-api) |
| `discernment-nudge` | > | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/discernment-nudge) |

### official-zh

| Skill | Description | Source |
| --- | --- | --- |
| `algorithmic-art` | 使用 p5.js 创建带有种子随机性和交互式参数探索的算法艺术。当用户请求使用代码创建艺术、生成艺术、算法艺术、流场或粒子系统时使用此技能。创作原创算法艺术，而不是复制现有艺术家的作品，以避免版权侵犯。 | [LeastBit/Anthropics_skills_zh-CN](https://github.com/LeastBit/Anthropics_skills_zh-CN/tree/main/skills/algorithmic-art) |
| `brand-guidelines` | 将 Anthropic 官方品牌颜色和字体应用于任何可能需要 Anthropic 视觉风格的作品。适用于品牌颜色或样式指南、视觉格式化或公司设计标准的场景。 | [LeastBit/Anthropics_skills_zh-CN](https://github.com/LeastBit/Anthropics_skills_zh-CN/tree/main/skills/brand-guidelines) |
| `canvas-design` | 使用设计哲学创作精美的 .png 和 .pdf 格式视觉艺术作品。当用户要求创作海报、艺术品、设计作品或其他静态作品时，应使用此技能。创作原创视觉设计，切勿复制现有艺术家的作品以避免版权侵权。 | [LeastBit/Anthropics_skills_zh-CN](https://github.com/LeastBit/Anthropics_skills_zh-CN/tree/main/skills/canvas-design) |
| `doc-coauthoring` | 引导用户通过结构化的工作流程来协作撰写文档。当用户想要撰写文档、提案、技术规格说明、决策文档或类似的结构化内容时使用。这个工作流程帮助用户高效地传递上下文信息、通过迭代优化内容，并验证文档对读者是否有效。当用户提到撰写文档、创建提案、起草规格说明或类似的文档任务时触发。 | [LeastBit/Anthropics_skills_zh-CN](https://github.com/LeastBit/Anthropics_skills_zh-CN/tree/main/skills/doc-coauthoring) |
| `docx` | 全面的文档创建、编辑和分析功能，支持修订追踪、批注、格式保留和文本提取。当 Claude 需要处理专业文档（.docx 文件）时使用：(1) 创建新文档，(2) 修改或编辑内容，(3) 处理修订追踪，(4) 添加批注，或其他任何文档任务 | [LeastBit/Anthropics_skills_zh-CN](https://github.com/LeastBit/Anthropics_skills_zh-CN/tree/main/skills/docx) |
| `frontend-design` | 创建独特的、生产级别的高质量前端界面。当用户要求构建网页组件、页面、作品、海报或应用程序时使用此技能（例如网站、落地页、仪表盘、React 组件、HTML/CSS 布局，或对任何网页 UI 进行样式美化）。生成富有创意、精致的代码和 UI 设计，避免千篇一律的 AI 审美。 | [LeastBit/Anthropics_skills_zh-CN](https://github.com/LeastBit/Anthropics_skills_zh-CN/tree/main/skills/frontend-design) |
| `internal-comms` | 一套帮助我撰写各类内部沟通文档的资源，使用公司偏好的格式。当被要求撰写任何形式的内部沟通文档（状态报告、领导层更新、3P 更新、公司简报、常见问题解答、事件报告、项目更新等）时，Claude 应使用此技能。 | [LeastBit/Anthropics_skills_zh-CN](https://github.com/LeastBit/Anthropics_skills_zh-CN/tree/main/skills/internal-comms) |
| `mcp-builder` | 构建高质量 MCP（模型上下文协议）服务器的指南，使 LLM 能够通过精心设计的工具与外部服务交互。在使用 Python (FastMCP) 或 Node/TypeScript (MCP SDK) 构建 MCP 服务器以集成外部 API 或服务时使用。 | [LeastBit/Anthropics_skills_zh-CN](https://github.com/LeastBit/Anthropics_skills_zh-CN/tree/main/skills/mcp-builder) |
| `pdf` | 全面的 PDF 操作工具包，用于提取文本和表格、创建新 PDF、合并/拆分文档以及处理表单。当 Claude 需要填写 PDF 表单或以编程方式大规模处理、生成或分析 PDF 文档时使用。 | [LeastBit/Anthropics_skills_zh-CN](https://github.com/LeastBit/Anthropics_skills_zh-CN/tree/main/skills/pdf) |
| `pptx` | 演示文稿创建、编辑和分析。当 Claude 需要处理演示文稿（.pptx 文件）时使用，包括：(1) 创建新演示文稿，(2) 修改或编辑内容，(3) 处理版式，(4) 添加批注或演讲者备注，或其他任何演示文稿任务 | [LeastBit/Anthropics_skills_zh-CN](https://github.com/LeastBit/Anthropics_skills_zh-CN/tree/main/skills/pptx) |
| `skill-creator` | 创建高效技能的指南。当用户想要创建新技能（或更新现有技能）以扩展 Claude 的能力，包括专业知识、工作流程或工具集成时，应使用此技能。 | [LeastBit/Anthropics_skills_zh-CN](https://github.com/LeastBit/Anthropics_skills_zh-CN/tree/main/skills/skill-creator) |
| `slack-gif-creator` | 用于创建针对 Slack 优化的动画 GIF 的知识和工具集。提供约束条件、验证工具和动画概念。当用户请求为 Slack 创建动画 GIF 时使用，例如"为 Slack 制作一个 X 做 Y 的 GIF"。 | [LeastBit/Anthropics_skills_zh-CN](https://github.com/LeastBit/Anthropics_skills_zh-CN/tree/main/skills/slack-gif-creator) |
| `theme-factory` | 用于为作品应用主题样式的工具包。这些作品可以是幻灯片、文档、报告、HTML 落地页等。提供 10 个预设主题，包含颜色/字体配置，可应用于任何已创建的作品，也可以即时生成新主题。 | [LeastBit/Anthropics_skills_zh-CN](https://github.com/LeastBit/Anthropics_skills_zh-CN/tree/main/skills/theme-factory) |
| `web-artifacts-builder` | 用于使用现代前端 Web 技术（React、Tailwind CSS、shadcn/ui）创建复杂的、多组件的 claude.ai HTML artifact 的工具套件。适用于需要状态管理、路由或 shadcn/ui 组件的复杂 artifact - 不适用于简单的单文件 HT | [LeastBit/Anthropics_skills_zh-CN](https://github.com/LeastBit/Anthropics_skills_zh-CN/tree/main/skills/web-artifacts-builder) |
| `webapp-testing` | 使用 Playwright 与本地 Web 应用程序交互及进行测试的工具包。支持验证前端功能、调试 UI 行为、捕获浏览器截图以及查看浏览器日志。 | [LeastBit/Anthropics_skills_zh-CN](https://github.com/LeastBit/Anthropics_skills_zh-CN/tree/main/skills/webapp-testing) |
| `xlsx` | 全面的电子表格创建、编辑和分析功能，支持公式、格式化、数据分析和可视化。当 Claude 需要处理电子表格（.xlsx、.xlsm、.csv、.tsv 等）时使用，包括：(1) 创建带有公式和格式的新电子表格，(2) 读取或分析数据，(3) 修改现有电子表格同时保留公式，(4)  | [LeastBit/Anthropics_skills_zh-CN](https://github.com/LeastBit/Anthropics_skills_zh-CN/tree/main/skills/xlsx) |

## Skipped

110 entries skipped (limits, duplicates, invalid frontmatter). See `index.json`.

---

Generated by `scripts/build.mjs`. File contents belong to their upstream authors.