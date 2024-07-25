"use client";

interface ButtonProps {
    format?: "primary" | "secondary" | "outline" | "free";
    disabled?: boolean;
    onClick?: () => void;
    href?: string;
    children?: React.ReactNode;
    size?: "small" | "medium" | "large";
    wide?: boolean;
    active?: boolean;
}

export default function Button(props:ButtonProps){
    const className = `no-underline rounded-lg flex-none flex flex-row ${props.wide ? 'grow' : ''} items-center text-center justify-center font-semibold transition-all bg-gradient-to-br border ${props.format === 'secondary' ? 'bg-yellow-300 from-orange-500/0 to-orange-500/30 hover:to-orange-500/50 text-purple-800 border-yellow-200' : props.format === 'outline' ? 'from-white/0 to-white/0 border-2 border-purple-800 bg-white/0 hover:bg-white/10' : props.format === 'free' ? 'from-white/0 to-white/0 border-0 bg-white/0 hover:bg-white/10' : 'bg-purple-800 from-orange-500/0 to-orange-500/20 hover:to-orange-500/40 text-white border-purple-400'} ${props.size && props.size === 'large' ? 'p-6 gap-4 text-xl' : props.size && props.size === 'small' ? 'p-2 gap-1 text-base' : 'p-4 gap-2 text-lg'} ${props.disabled ? 'opacity-75 cursor-not-allowed pointer-events-none' : ''} ${props.active ? 'outline' : ''}`;

    if(props.href){
        return(
            <>
                <a
                    className={className}
                    href={props.href}
                >
                        {props.children || "Click Here"}
                </a>
            </>
        )
    }
    else {
        return(
            <>
                <button
                    className={className}
                    disabled={props.disabled}
                    onClick={props.onClick}
                >
                    {props.children || "Click Here"}
                </button>
            </>
        )
    }
}