import { createTranslator } from "../i18n";
import type { Language } from "../types";

interface Props {
  language: Language;
  onEnterApp: () => void;
  onToggleLanguage: () => void;
}

const screenSlides = [
  {
    label: "DISCOVERY AGENT",
    lines: ["parse project", "map contracts", "surface findings"],
  },
  {
    label: "VERIFY AGENT",
    lines: ["read report", "draft exploit path", "generate PoC"],
  },
  {
    label: "FOUNDRY PROOF",
    lines: ["compile test", "run scenario", "emit verdict"],
  },
];

export default function LandingPage({
  language,
  onEnterApp,
  onToggleLanguage,
}: Props) {
  const t = createTranslator(language);

  const metrics = [
    [t("home.metric.modeLabel"), t("home.metric.modeValue")],
    [t("home.metric.stackLabel"), t("home.metric.stackValue")],
    [t("home.metric.outputLabel"), t("home.metric.outputValue")],
  ];

  const modes = [
    {
      kicker: t("mode.discovery.kicker"),
      title: t("mode.discovery.title"),
      text: t("mode.discovery.text"),
    },
    {
      kicker: t("mode.verify.kicker"),
      title: t("mode.verify.title"),
      text: t("mode.verify.text"),
    },
  ];

  const workflow = [
    {
      title: t("home.workflow.parseTitle"),
      text: t("home.workflow.parseText"),
    },
    {
      title: t("home.workflow.detectTitle"),
      text: t("home.workflow.detectText"),
    },
    {
      title: t("home.workflow.verifyTitle"),
      text: t("home.workflow.verifyText"),
    },
  ];

  const valuePoints = [
    t("home.value.scan"),
    t("home.value.llm"),
    t("home.value.foundry"),
  ];

  return (
    <div className="retro-page">
      <button
        className="retro-lang"
        onClick={onToggleLanguage}
        aria-label={t("language.label")}
      >
        {language === "en" ? t("language.chinese") : t("language.english")}
      </button>

      <main className="retro-shell">
        <section className="retro-copy">
          <div className="retro-eyebrow">{t("upload.eyebrow")}</div>
          <h1>{t("upload.title")}</h1>
          <p className="retro-lead">{t("upload.subtitle")}</p>

          <div className="retro-actions">
            <button className="retro-primary" onClick={onEnterApp}>
              {t("home.enter")}
            </button>
            <span className="retro-tag">Foundry / Slither / LLM Agent</span>
          </div>

          <div className="retro-metrics">
            {metrics.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="retro-mode-grid">
            {modes.map((mode) => (
              <article key={mode.title} className="retro-card">
                <span>{mode.kicker}</span>
                <h2>{mode.title}</h2>
                <p>{mode.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="retro-product" aria-label="Audit workstation">
          <div className="mac-scene">
            <div className="mac-unit">
              <div className="mac-face mac-front">
                <div className="mac-screen-inset">
                  <div className="mac-crt">
                    <div className="mac-crt-ui">
                      <div className="mac-crt-sidebar">
                        <span>AGENTS</span>
                        <i />
                        <i />
                        <i />
                      </div>
                      <div className="mac-crt-main">
                        <div className="mac-window">
                          <div className="mac-window-head">
                            <span>SECURITY LOOP</span>
                            <span>LIVE</span>
                          </div>
                          <div className="mac-slide-stage">
                            {screenSlides.map((slide, index) => (
                              <div
                                className="mac-slide"
                                key={slide.label}
                                style={{ animationDelay: `${index * 4}s` }}
                              >
                                <strong>{slide.label}</strong>
                                {slide.lines.map((line) => (
                                  <p key={line}>$ {line}</p>
                                ))}
                              </div>
                            ))}
                            <b className="mac-cursor" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mac-floppy-slot" />
                <div className="mac-sticker mac-sticker-disc">AI</div>
                <div className="mac-sticker mac-sticker-text">BEIJING<br />ETH</div>
                <div className="mac-grill">
                  {Array.from({ length: 16 }).map((_, index) => (
                    <i key={index} />
                  ))}
                </div>
              </div>
              <div className="mac-face mac-back" />
              <div className="mac-face mac-left" />
              <div className="mac-face mac-right" />
              <div className="mac-face mac-top" />
              <div className="mac-face mac-bottom" />
            </div>
            <div className="mac-keyboard-assembly">
              <div className="mac-kb-shadow" />
              <div className="mac-kb-base">
                <div className="mac-keys-grid">
                  {Array.from({ length: 36 }).map((_, index) => (
                    <i
                      key={index}
                      className={
                        index === 28 ? "space" : index % 11 === 0 ? "wide" : ""
                      }
                    />
                  ))}
                </div>
              </div>
              <div className="mac-kb-front" />
              <div className="mac-kb-back" />
              <div className="mac-kb-left" />
              <div className="mac-kb-right" />
            </div>
          </div>
        </section>

        <section className="retro-workflow">
          <div className="retro-section-head">
            <h2>{t("home.workflow.title")}</h2>
            <span />
          </div>
          <div className="retro-workflow-grid">
            {workflow.map((step) => (
              <article key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
          <div className="retro-pills">
            {valuePoints.map((point) => (
              <span key={point}>{point}</span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
