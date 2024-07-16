import SearchForm from "../features/SearchForm";

export default function Check() {
  const defaultDomain = process.env.DOMAIN ? process.env.DOMAIN : "twelve.cash";
  return (
      <main className="mx-auto max-w-2xl flex flex-col gap-9 w-full text-center p-6">
        <SearchForm defaultDomain={defaultDomain} />
      </main>
  );
}
