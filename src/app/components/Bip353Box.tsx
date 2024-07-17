import { Inter } from 'next/font/google'
import type { Bip353 } from '@/lib/util';

const inter = Inter({ subsets: ['latin'] })

type Bip353BoxProps = {
    users: Bip353[];
}

export default function Bip353Box(props:Bip353BoxProps){
    if(props.users.length === 1){
        return(
            <>
                <div className="bg-blue-900 text-white text-4xl p-9 rounded-xl font-light overflow-x-hidden">
                    <p className="flex flex-row gap-2 w-full justify-between">
                    <span className={inter.className + " text-orange-200"}>₿</span>
                    <span className="whitespace-nowrap overflow-ellipsis overflow-hidden w-full text-left">{props.users[0].user}</span>
                    <span className="text-12teal">@{props.users[0].domain}</span>
                    </p>
                </div>
            </>
        )
    }
    else {
        return(
            <>
                <div className="bg-blue-900 text-white text-4xl p-9 rounded-xl font-light overflow-hidden">
                    <p className="flex flex-row gap-2 w-full justify-between">
                    <span className={inter.className + " text-orange-200"}>₿</span>
                    
                        <span className={`whitespace-nowrap overflow-ellipsis overflow-hidden w-full text-left relative`}>
                        {props.users.map((user, index) => (
                            <span className={`absolute animate-slide-up-${index+1}`}>
                                {user.user}
                            </span>
                        ))}
                        </span>
                    
                    {/* <span className="whitespace-nowrap overflow-ellipsis overflow-hidden w-full text-left animate-slide-up-1 animate-slide-up-2 animate-slide-up-3 animate-slide-up-4 animate-slide-up-5 animate-slide-up-6">
                        {props.users[0].user}
                    </span> */}
                    <span className="text-12teal">@{props.users[0].domain}</span>
                    </p>
                </div>
            </>
        )
    }
}