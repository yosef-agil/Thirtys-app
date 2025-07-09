import React from "react";
import { Document, Page, Text, Image, View, StyleSheet,} from "@react-pdf/renderer";

// Tailwind-like styles using StyleSheet
const styles = StyleSheet.create({
  page: {
    padding: 20, // p-8
    fontSize: 12, // text-sm
    fontFamily: "Helvetica", // font-sans
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row", // flex
    justifyContent: "space-between", // justify-between
    alignContent: "flex-start",
    marginBottom: 20, // mb-5
    backgroundColor: "#F6F6F8",
    padding: 24,
  },
  brand: {
    fontWeight: "bold",
    fontSize: 20,
  },
  logoBrand: {
    width: 120,
    height: 60,
  },
  headerBrand: {
    fontWeight: "bold",
    fontSize: 20,
  },
  image: {
    width: 120, // w-24
    height: 69, // h-12
  },
  section: {
    marginBottom: 10, // mb-2.5
  },
  text: {
    fontSize: 12, // text-sm
    marginBottom: 5, // mb-1
  },
  table: {
    width: "100%", // w-full
    borderStyle: "solid", // border
    borderWidth: 1, // border
    marginTop: 10, // mt-2.5
  },
  row: {
    flexDirection: "row", // flex
  },
  Details:{
    flexDirection: "row", // flex
    justifyContent: "space-between",
  },
  textNote:{
    fontStyle: "italic",
    width:200,
  },
  cellHeader: {
    flex: 1, // flex-1
    borderWidth: 1, // border
    padding: 8, // p-2
    backgroundColor: "#2E2E48", // bg-[#2E2E48]
    color: "white", // text-white
    fontWeight: "bold", // font-bold
  },
  cell: {
    flex: 1, // flex-1
    borderWidth: 1, // border
    padding: 8, // p-2
  },
  totalContainer: {
    marginTop: 30, // mt-4
    alignItems: "flex-end", // items-end
    gap: 4,
  },
  totalText: {
    fontSize: 14, // text-base
    fontWeight: "bold", // font-bold
  },
  sectionFooter: {
    marginTop: 30, // mt-8
    fontSize: 10, // text-xs
    textAlign: "center", // text-center
    backgroundColor: "#F6F6F8",
    justifyContent: "space-between",
    padding: 30,
  },
  inv:{
    display: "flex",
    gap: 2,
  },
});

const PDFInvoice = ({ invoice }) => {
  const subtotal = invoice?.items?.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0) || 0;
  const downpayment = parseFloat(invoice?.downpayment || 0);
  const discount = (invoice?.discount / 100) * subtotal || 0;
  const total = subtotal - downpayment - discount;
  const logoBase64 = "data:image/png;base64,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"

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.wrap}>
          {/* Header */}
          <View style={styles.header}>
            {/* Use the image from the public folder */}
            <Image 
                style={styles.logoBrand}
                src={logoBase64}
            />
            <View style={styles.inv}>
              <Text style={styles.headerBrand}>Invoice</Text>
              <Text>{invoice?.inv_id || "N/A"}</Text>
            </View>

          </View>

          {/* Info Bisnis dan Pelanggan */}
          <View style={styles.section}>
            <Text style={styles.text}>From: Thirtyone Studio</Text>
            <Text style={styles.text}>Jl. Cungkup No. 466, Sidorejo, Salatiga 50711</Text>
            <Text style={styles.text}>082371097483</Text>
          </View>

          <View style={styles.customer}>
            <Text style={[styles.text, { marginTop: 10 }]}>For: {invoice?.customer || "N/A"}</Text>
            <Text style={styles.text}>Due Date: {invoice?.due_date ? new Date(invoice.due_date).toLocaleDateString("id-ID") : "N/A"}</Text>
          </View>

          {/* Tabel Invoice */}
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.cellHeader}>Description</Text>
              <Text style={styles.cellHeader}>Total</Text>
            </View>
            {invoice?.items?.map((item, index) => (
              <View key={index} style={styles.row}>
                <Text style={styles.cell}>{item.description}</Text>
                <Text style={styles.cell}>Rp {parseFloat(item.price).toLocaleString("id-ID")}</Text>
              </View>
            ))}
          </View>

          <View style={styles.Details}>
            <View>
              <Text style={[styles.textNote, { marginTop: 30 }]}>Note: {invoice?.time_slots || "N/A"}</Text>
            </View>

            {/* Total */}
            <View style={styles.totalContainer}>
              <Text style={styles.text}>Subtotal: Rp{subtotal.toLocaleString("id-ID")}</Text>
              <Text style={styles.text}>Subtotal: Rp{downpayment.toLocaleString("id-ID")}</Text>
              <Text style={styles.text}>Discount {invoice?.discount || 0}%: -Rp{discount.toLocaleString("id-ID")}</Text>
              <Text style={styles.totalText}>Total: Rp{total.toLocaleString("id-ID")}</Text>
            </View>
          </View>

        </View>

        {/* Footer */}
        <View>
          {/* Metode Pembayaran */}
          {/* <View style={styles.section}>
            <Text style={[styles.text, { fontWeight: "bold", marginTop: 10 }]}>Metode Pembayaran:</Text>
            <Text style={styles.text}>BCA (Nadhita Crisya) - 580201024795533</Text>
            <Text style={styles.text}>BRI (Nadhita Crisya) - 0132189968</Text>
            <Text style={styles.text}>BCA (Yosef Agil) - 8445203480</Text>
            <Text style={styles.text}>Jago (Yosef Agil) - 102328996443</Text>
            <Text style={[styles.text, { fontSize: 10, marginTop: 5 }]}>
              *Wajib mengirimkan bukti pembayaran ke WhatsApp admin
            </Text>
          </View> */}

          <View style={styles.sectionFooter}>
            <Text style={styles.footer}>Thirtyone Studio | thirtyone.studio1@gmail.com</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// Preview Component
// const PDFPreview = () => {
//   // Sample invoice data
//   const sampleInvoice = {
//     customer: "John Doe",
//     discount: 10,
//     items: [
//       { description: "Website Development", due_date: "2023-10-31", price: "5000000" },
//       { description: "Logo Design", due_date: "2023-11-05", price: "1500000" },
//     ],
//   };

//   return (
//     <PDFViewer width="100%" height="600px">
//       <PDFInvoice invoice={sampleInvoice} />
//     </PDFViewer>
//   );
// };

export default PDFInvoice;