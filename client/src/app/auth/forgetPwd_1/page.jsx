import styles from "./styles.module.scss";
import "../../../styles/global.scss"
import Link from "next/link";



export default function ForgotPassword() {
  return (
    <div className={styles.container}>
      an email was sent to you to reset password
    </div>
  );
}
