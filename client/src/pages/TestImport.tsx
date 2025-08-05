import SimpleLayout from "@/components/SimpleLayout";

export default function TestImport() {
  console.log("TestImport component is rendering!");
  
  return (
    <SimpleLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold">Import Management</h1>
        <p className="mt-4">This is the Import Management page - it works!</p>
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <p>✅ Page is loading correctly</p>
          <p>✅ Navigation should work</p>
          <p>✅ Route /import-management is functional</p>
          <p>🔍 Check browser console for debug info</p>
        </div>
      </div>
    </SimpleLayout>
  );
}