import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

type Bip353BoxProps = {
    user: string;
    domain: string;
}

export default function Bip353Box(props:Bip353BoxProps){
    return(
        <>
        <div className="bg-blue-900 text-white text-4xl p-9 rounded-xl font-light overflow-hidden">
            <p className="flex flex-row gap-2 w-full justify-between">
            <span className={inter.className + " text-orange-200"}>₿</span>
            <span className="whitespace-nowrap overflow-ellipsis overflow-hidden w-full text-left">{props.user}</span>
            <span className="text-12teal">@{props.domain}</span>
            </p>
        </div>
        </>
    )
}