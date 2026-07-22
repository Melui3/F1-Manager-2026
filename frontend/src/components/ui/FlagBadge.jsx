import { COUNTRY_CODE, GP_COUNTRY_CODE } from "../../data/labels";

function Stripe({ y = 0, height = 16, fill }) {
    return <rect x="0" y={y} width="24" height={height} fill={fill} />;
}

function VStripe({ x = 0, width = 8, fill }) {
    return <rect x={x} y="0" width={width} height="16" fill={fill} />;
}

function Cross({ color = "#fff", stroke = 2 }) {
    return (
        <>
            <path d="M0 0 24 16M24 0 0 16" stroke={color} strokeWidth={stroke} />
            <path d="M12 0v16M0 8h24" stroke={color} strokeWidth={stroke + 1} />
        </>
    );
}

function CountryFlag({ code, title }) {
    const c = String(code || "FIA").toUpperCase();

    const common = {
        viewBox: "0 0 24 16",
        className: "h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgba(255,255,255,0.22)]",
        role: "img",
        "aria-label": title || c,
    };

    const mono = (fill) => (
        <svg {...common}><rect width="24" height="16" fill={fill} /></svg>
    );

    switch (c) {
        case "FRA":
            return <svg {...common}><VStripe fill="#0055a4" /><VStripe x="8" fill="#fff" /><VStripe x="16" fill="#ef4135" /></svg>;
        case "ITA":
            return <svg {...common}><VStripe fill="#009246" /><VStripe x="8" fill="#fff" /><VStripe x="16" fill="#ce2b37" /></svg>;
        case "NED":
            return <svg {...common}><Stripe height="5.33" fill="#ae1c28" /><Stripe y="5.33" height="5.34" fill="#fff" /><Stripe y="10.67" height="5.33" fill="#21468b" /></svg>;
        case "GER":
            return <svg {...common}><Stripe height="5.33" fill="#000" /><Stripe y="5.33" height="5.34" fill="#dd0000" /><Stripe y="10.67" height="5.33" fill="#ffce00" /></svg>;
        case "ESP":
            return <svg {...common}><Stripe height="4" fill="#aa151b" /><Stripe y="4" height="8" fill="#f1bf00" /><Stripe y="12" height="4" fill="#aa151b" /></svg>;
        case "ARG":
            return <svg {...common}><Stripe height="5.33" fill="#74acdf" /><Stripe y="5.33" height="5.34" fill="#fff" /><Stripe y="10.67" height="5.33" fill="#74acdf" /><circle cx="12" cy="8" r="1.7" fill="#f6b40e" /></svg>;
        case "BRA":
            return <svg {...common}><rect width="24" height="16" fill="#009b3a" /><path d="M12 2 22 8 12 14 2 8z" fill="#ffdf00" /><circle cx="12" cy="8" r="3.2" fill="#002776" /></svg>;
        case "MEX":
            return <svg {...common}><VStripe fill="#006847" /><VStripe x="8" fill="#fff" /><VStripe x="16" fill="#ce1126" /><circle cx="12" cy="8" r="1.5" fill="#8c6f3f" /></svg>;
        case "FIN":
            return <svg {...common}><rect width="24" height="16" fill="#fff" /><rect x="6" width="3" height="16" fill="#002f6c" /><rect y="6.5" width="24" height="3" fill="#002f6c" /></svg>;
        case "SWE":
            return <svg {...common}><rect width="24" height="16" fill="#006aa7" /><rect x="7" width="3" height="16" fill="#fecc00" /><rect y="6.5" width="24" height="3" fill="#fecc00" /></svg>;
        case "THA":
            return <svg {...common}><Stripe height="2.5" fill="#a51931" /><Stripe y="2.5" height="2.5" fill="#f4f5f8" /><Stripe y="5" height="6" fill="#2d2a4a" /><Stripe y="11" height="2.5" fill="#f4f5f8" /><Stripe y="13.5" height="2.5" fill="#a51931" /></svg>;
        case "MON":
            return <svg {...common}><Stripe height="8" fill="#ce1126" /><Stripe y="8" height="8" fill="#fff" /></svg>;
        case "AUS":
            return <svg {...common}><rect width="24" height="16" fill="#012169" /><rect width="10" height="7" fill="#012169" /><Cross /><Cross color="#c8102e" stroke={1} /><circle cx="18" cy="4" r="1" fill="#fff" /><circle cx="20.5" cy="8" r="0.8" fill="#fff" /><circle cx="16.5" cy="11.5" r="0.9" fill="#fff" /></svg>;
        case "GBR":
            return <svg {...common}><rect width="24" height="16" fill="#012169" /><Cross stroke={2.6} /><Cross color="#c8102e" stroke={1.2} /></svg>;
        case "CAN":
            return <svg {...common}><VStripe width="6" fill="#d52b1e" /><VStripe x="6" width="12" fill="#fff" /><VStripe x="18" width="6" fill="#d52b1e" /><path d="M12 3.2 13 6h2.2l-1.8 1.4.8 2.8L12 8.7l-2.2 1.5.8-2.8L8.8 6H11z" fill="#d52b1e" /></svg>;
        case "CHN":
            return <svg {...common}><rect width="24" height="16" fill="#de2910" /><path d="M5 2.7 5.6 4.4h1.8L6 5.4l.5 1.8L5 6.1 3.5 7.2 4 5.4 2.6 4.4h1.8z" fill="#ffde00" /><circle cx="9" cy="3" r="0.6" fill="#ffde00" /><circle cx="10.8" cy="5" r="0.5" fill="#ffde00" /><circle cx="10.5" cy="7.5" r="0.5" fill="#ffde00" /><circle cx="8.4" cy="9" r="0.5" fill="#ffde00" /></svg>;
        case "JPN":
            return <svg {...common}><rect width="24" height="16" fill="#fff" /><circle cx="12" cy="8" r="4" fill="#bc002d" /></svg>;
        case "BHR":
            return <svg {...common}><rect width="24" height="16" fill="#ce1126" /><path d="M0 0h8l-3 1.6 3 1.6-3 1.6 3 1.6-3 1.6 3 1.6-3 1.6 3 1.6-3 1.6L8 16H0z" fill="#fff" /></svg>;
        case "SAU":
            return <svg {...common}><rect width="24" height="16" fill="#006c35" /><rect x="6" y="10.5" width="12" height="1.2" rx="0.6" fill="#fff" /><rect x="7" y="5" width="10" height="2" rx="0.5" fill="#fff" opacity="0.9" /></svg>;
        case "USA":
            return <svg {...common}>{Array.from({ length: 13 }).map((_, i) => <Stripe key={i} y={i * 1.23} height="1.23" fill={i % 2 ? "#fff" : "#b22234"} />)}<rect width="10.5" height="8.6" fill="#3c3b6e" /><g fill="#fff">{Array.from({ length: 12 }).map((_, i) => <circle key={i} cx={1.6 + (i % 4) * 2.1} cy={1.4 + Math.floor(i / 4) * 2.1} r="0.35" />)}</g></svg>;
        case "AUT":
            return <svg {...common}><Stripe height="5.33" fill="#ed2939" /><Stripe y="5.33" height="5.34" fill="#fff" /><Stripe y="10.67" height="5.33" fill="#ed2939" /></svg>;
        case "BEL":
            return <svg {...common}><VStripe fill="#000" /><VStripe x="8" fill="#fae042" /><VStripe x="16" fill="#ed2939" /></svg>;
        case "HUN":
            return <svg {...common}><Stripe height="5.33" fill="#ce2939" /><Stripe y="5.33" height="5.34" fill="#fff" /><Stripe y="10.67" height="5.33" fill="#477050" /></svg>;
        case "AZE":
            return <svg {...common}><Stripe height="5.33" fill="#00b5e2" /><Stripe y="5.33" height="5.34" fill="#ef3340" /><Stripe y="10.67" height="5.33" fill="#509e2f" /><circle cx="12" cy="8" r="2" fill="#fff" /><circle cx="12.8" cy="8" r="1.7" fill="#ef3340" /><circle cx="15.2" cy="8" r="0.7" fill="#fff" /></svg>;
        case "SGP":
            return <svg {...common}><Stripe height="8" fill="#ef3340" /><Stripe y="8" height="8" fill="#fff" /><circle cx="6" cy="4" r="2.1" fill="#fff" /><circle cx="6.7" cy="4" r="1.8" fill="#ef3340" /><circle cx="9.5" cy="2.8" r="0.45" fill="#fff" /><circle cx="10.8" cy="4" r="0.45" fill="#fff" /><circle cx="9.5" cy="5.2" r="0.45" fill="#fff" /></svg>;
        case "QAT":
            return <svg {...common}><rect width="24" height="16" fill="#8d1b3d" /><path d="M0 0h8l-2 0.9 2 0.9-2 0.9 2 0.9-2 0.9 2 0.9-2 0.9 2 0.9-2 0.9 2 0.9-2 0.9 2 0.9-2 0.9 2 0.9-2 0.9 2 0.9-2 0.9L8 16H0z" fill="#fff" /></svg>;
        case "UAE":
            return <svg {...common}><VStripe width="6" fill="#ff0000" /><rect x="6" width="18" height="5.33" fill="#00732f" /><rect x="6" y="5.33" width="18" height="5.34" fill="#fff" /><rect x="6" y="10.67" width="18" height="5.33" fill="#000" /></svg>;
        default:
            return mono("#222");
    }
}

export default function FlagBadge({ country, gpName, label, compact = false, className = "" }) {
    const sourceLabel = country || gpName || "";
    const fallbackCode = country && country.length <= 3 ? country.toUpperCase() : "FIA";
    const code = (gpName ? GP_COUNTRY_CODE[gpName] : COUNTRY_CODE[country]) || fallbackCode;
    const showLabel = label ?? (!compact && !!sourceLabel);

    if (!sourceLabel || sourceLabel === "—" || sourceLabel === "-") return null;

    return (
        <span
            className={[
                "inline-flex items-center gap-1.5 rounded-full border border-f1-border bg-f1-dark/70 px-2 py-0.5",
                "text-[11px] font-bold text-f1-silver tabular-nums whitespace-nowrap align-middle",
                className,
            ].filter(Boolean).join(" ")}
            title={sourceLabel || "Drapeau"}
        >
            <CountryFlag code={code} title={sourceLabel || code} />
            <span className="font-f1-display text-[10px] tracking-wider text-f1-white">{code}</span>
            {showLabel && <span className="text-[11px] text-f1-muted">{sourceLabel}</span>}
        </span>
    );
}
