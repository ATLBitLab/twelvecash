type TwelveCashLogoProps = {
    size?: "small" | "large";
}

export default function TwelveCashLogo(props:TwelveCashLogoProps) {
    return(
        <>
            <a href="/" className={`${props.size === 'large' ? 'text-4xl' : 'text-2xl'} bg-purple-800 bg-gradient-to-br from-[#00F0FF]/40 to-[#00F0FF]/0 inline-block rounded-full text-white tracking-tight font-light no-underline overflow-hidden shadow-lg flex-none`}>
                <span className={`${props.size === 'large' ? 'px-10 py-6' : 'px-5 py-3'} inline-block bg-white/0 hover:bg-white/10 transition-all duration-200`}>Twelve&nbsp;Cash</span>
            </a>
        </>
    )
}