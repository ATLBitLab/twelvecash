import { RefreshIcon } from "@bitcoin-design/bitcoin-icons-react/filled";
import Button from "../components/Button";

type NostrAuthSpinnerProps = {
    text: string;
    button?: boolean;
    buttonText?: string;
    buttonFunction?: () => void;
    buttonDisabled?: boolean;
}

export default function NostrAuthSpinner(props:NostrAuthSpinnerProps){
    return(
        <>
            <RefreshIcon className="w-20 h-20 animate-spin" />
            <p className="text-2xl">{props.text}</p>
            {props.button ?
                <Button onClick={props.buttonFunction} format="secondary" disabled={props.buttonDisabled}>{props.buttonText ? props.buttonText : "Click Here"}</Button>
            : ``}
        </>
        
    )
}