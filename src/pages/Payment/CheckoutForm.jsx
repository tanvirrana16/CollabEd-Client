import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useQuery } from "@tanstack/react-query";
import React, { useContext, useState } from "react";
import useFetchApi from "../../Api/useFetchApi";
import { FaLock, FaCreditCard } from "react-icons/fa";
import axios from "axios";
import { AuthContext } from "../../main";
import { SuccessToast } from "../../utils/ToastMaker";
import { useNavigate } from "react-router";

const CheckoutForm = ({ id }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { getSessionById, bookSession, savePayment } = useFetchApi();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { data: session } = useQuery({
    queryKey: ["session", id],
    queryFn: () => getSessionById(id),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");

    const card = elements.getElement(CardElement);
    if (!stripe || !elements || !card) return;

    setLoading(true);

    // Step 1 – create payment method
    const { error: methodError } = await stripe.createPaymentMethod({
      type: "card",
      card,
    });

    if (methodError) {
      setErrorMsg(methodError.message);
      setLoading(false);
      return;
    }

    // Step 2 – create payment intent on backend
    let clientSecret;
    try {
      const res = await axios.post(
        "https://collabedserver.vercel.app/create-payment-intent",
        { amount: parseInt(session?.registrationFee) }
      );
      clientSecret = res?.data?.clientSecret;
    } catch (err) {
      setErrorMsg("Could not create payment intent. Please try again.");
      setLoading(false);
      return;
    }

    if (!clientSecret) {
      setErrorMsg("Payment initialisation failed.");
      setLoading(false);
      return;
    }

    // Step 3 – confirm card payment
    const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card,
          billing_details: {
            name: user?.displayName || "Student",
            email: user?.email,
          },
        },
      }
    );

    if (confirmError) {
      setErrorMsg(confirmError.message);
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      SuccessToast("✅ Payment successful!");

      // Step 4 – persist payment record (revenue split done on backend)
      try {
        await savePayment({
          studentName: user?.displayName || "Student",
          studentEmail: user?.email,
          tutorName: session?.tutorName || "",
          tutorEmail: session?.tutorEmail || "",
          sessionId: String(session?._id),
          sessionTitle: session?.title || "",
          totalAmount: parseFloat(session?.registrationFee) || 0,
          transactionId: paymentIntent.id,
          paymentMethod: "card",
          paymentStatus: "succeeded",
        });
      } catch (saveErr) {
        // Non-fatal: log but don't block booking
        console.error("Failed to save payment record:", saveErr);
      }

      // Step 5 – create booking record
      const bookData = await bookSession({
        studentEmail: user.email,
        tutorEmail: session.tutorEmail,
        sessionId: String(session._id),
        sessionTitle: session.title,
      });

      if (bookData?.acknowledged) {
        SuccessToast("🎉 Session booked successfully!");
        navigate("/studentDashboard/bookedSession");
      }
    }

    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-5">
      <div className="card shadow-lg bg-base-100 border border-base-300 rounded-xl">
        <div className="card-body">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FaCreditCard className="text-primary" />
            Secure Payment
          </h2>
          <p className="text-sm text-base-content/60 mb-4">
            Pay <strong>${session?.registrationFee || 0}</strong> to enrol in{" "}
            <span className="font-medium">{session?.title}</span> with{" "}
            <span className="font-medium">{session?.tutorName}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <CardElement
              className="border rounded-md p-4 bg-base-200"
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "var(--fallback-bc, #000)",
                    "::placeholder": { color: "#aaa" },
                  },
                  invalid: { color: "red" },
                },
              }}
            />

            {errorMsg && (
              <p className="text-error text-sm font-medium">{errorMsg}</p>
            )}

            <button
              className={`btn btn-primary w-full flex items-center justify-center gap-2 ${loading ? "loading" : ""
                }`}
              type="submit"
              disabled={!stripe || loading}
            >
              {!loading && <FaLock />}
              {loading ? "Processing…" : `Pay $${session?.registrationFee || ""}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
