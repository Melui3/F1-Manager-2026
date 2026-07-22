import Header from "./Header";
import PrivacyFooter from "./PrivacyFooter";

export default function SetupLayout({ children }) {
    return (
        <div className="min-h-screen bg-f1-dark text-f1-white flex flex-col">
            <Header />
            <main className="flex-1 flex flex-col">{children}</main>
            <PrivacyFooter />
        </div>
    );
}
