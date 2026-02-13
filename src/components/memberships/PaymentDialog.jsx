"use client"

import { useState } from "react"
import CloseIcon from "@mui/icons-material/Close"
import AttachMoneyIcon from "@mui/icons-material/AttachMoney"
import CreditCardIcon from "@mui/icons-material/CreditCard"
import AccountBalanceIcon from "@mui/icons-material/AccountBalance"
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet"
import InfoIcon from "@mui/icons-material/Info"
import { NumericFormat } from "react-number-format"

export default function PaymentDialog({ isOpen, onClose, onSuccess, membershipData, planData }) {
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("cash")

  const handlePayment = async () => {
    try {
      setLoading(true)

      const paymentData = {
        ...membershipData,
        payment_method: paymentMethod,
      }

      await onSuccess(paymentData)

      onClose()
    } catch (error) {
      console.error("[v0] Error al procesar pago:", error)
      alert(error.response?.data?.message || "Error al procesar el pago")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !planData) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <AttachMoneyIcon className="text-yellow-500" />
            Procesar Pago
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Resumen del plan */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Resumen de la Membresía</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-gray-600">Plan</span>
                <p className="font-medium text-gray-900">{planData.name}</p>
              </div>
              <div>
                <span className="text-xs text-gray-600">Duración</span>
                <p className="font-medium text-gray-900">{planData.duration_days} días</p>
              </div>
              <div>
                <span className="text-xs text-gray-600">Total a pagar</span>
                <NumericFormat
                  value={planData.price}
                  displayType="text"
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="$ "
                  decimalScale={2}
                  fixedDecimalScale
                  className="text-xl font-bold text-yellow-600"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Seleccionar Método de Pago *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Efectivo */}
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === "cash"
                    ? "border-green-500 bg-green-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300 hover:shadow"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    paymentMethod === "cash" ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  <AttachMoneyIcon
                    className={paymentMethod === "cash" ? "text-green-600" : "text-gray-400"}
                    sx={{ fontSize: 28 }}
                  />
                </div>
                <div className="text-center">
                  <p
                    className={`font-semibold text-sm ${paymentMethod === "cash" ? "text-green-900" : "text-gray-700"}`}
                  >
                    Efectivo
                  </p>
                  <p className="text-xs text-gray-500">Pago en caja</p>
                </div>
              </button>

              {/* Transferencia */}
              <button
                type="button"
                onClick={() => setPaymentMethod("transfer")}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === "transfer"
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300 hover:shadow"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    paymentMethod === "transfer" ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  <AccountBalanceIcon
                    className={paymentMethod === "transfer" ? "text-blue-600" : "text-gray-400"}
                    sx={{ fontSize: 28 }}
                  />
                </div>
                <div className="text-center">
                  <p
                    className={`font-semibold text-sm ${paymentMethod === "transfer" ? "text-blue-900" : "text-gray-700"}`}
                  >
                    Transferencia
                  </p>
                  <p className="text-xs text-gray-500">Bancaria</p>
                </div>
              </button>

              {/* Tarjeta de Crédito */}
              <button
                type="button"
                onClick={() => setPaymentMethod("credit_card")}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === "credit_card"
                    ? "border-purple-500 bg-purple-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300 hover:shadow"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    paymentMethod === "credit_card" ? "bg-purple-100" : "bg-gray-100"
                  }`}
                >
                  <CreditCardIcon
                    className={paymentMethod === "credit_card" ? "text-purple-600" : "text-gray-400"}
                    sx={{ fontSize: 28 }}
                  />
                </div>
                <div className="text-center">
                  <p
                    className={`font-semibold text-sm ${paymentMethod === "credit_card" ? "text-purple-900" : "text-gray-700"}`}
                  >
                    Tarjeta
                  </p>
                  <p className="text-xs text-gray-500">Crédito/Débito</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("current_account")}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === "current_account"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300 hover:shadow"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    paymentMethod === "current_account" ? "bg-orange-100" : "bg-gray-100"
                  }`}
                >
                  <AccountBalanceWalletIcon
                    className={paymentMethod === "current_account" ? "text-orange-600" : "text-gray-400"}
                    sx={{ fontSize: 28 }}
                  />
                </div>
                <div className="text-center">
                  <p
                    className={`font-semibold text-sm ${paymentMethod === "current_account" ? "text-orange-900" : "text-gray-700"}`}
                  >
                    Cuenta Corriente
                  </p>
                  <p className="text-xs text-gray-500">A crédito</p>
                </div>
              </button>
            </div>
          </div>

          {paymentMethod === "current_account" && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3 animate-fadeIn">
              <InfoIcon className="text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-orange-900 mb-1">Pago a cuenta corriente</p>
                <p className="text-orange-700">
                  Esta membresía se registrará como deuda en la cuenta corriente del cliente. El monto no ingresará a
                  caja hasta que se registre el pago.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handlePayment}
            className="flex-1 px-4 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            disabled={loading}
          >
            {loading
              ? "Procesando..."
              : paymentMethod === "current_account"
                ? "Registrar a Cuenta Corriente"
                : "Confirmar Pago"}
          </button>
        </div>
      </div>
    </div>
  )
}
