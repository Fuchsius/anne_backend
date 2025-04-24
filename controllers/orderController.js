const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const createOrder = async (req, res) => {
  try {
    console.log('Received order request:', req.body);
    console.log('Received file:', req.file);

    let orderData;
    try {
      orderData = typeof req.body.orderData === 'string' 
        ? JSON.parse(req.body.orderData)
        : req.body.orderData;
    } catch (e) {
      console.error('Error parsing order data:', e);
      return res.status(400).json({ error: 'Invalid order data format' });
    }

    // Update validation to check for required fields
    if (!orderData.userId || !orderData.totalPrice || !orderData.items || !Array.isArray(orderData.items)) {
      return res.status(400).json({ error: 'Missing required order data' });
    }

    const paymentSlipUrl = req.file ? `/uploads/payment-slips/${req.file.filename}` : null;
    console.log('Payment slip URL:', paymentSlipUrl);

    // First create the shipping address
    let shippingAddress = null;
    try {
      if (orderData.shippingDetails) {
        // Update user's phone number
        await prisma.user.update({
          where: { id: parseInt(orderData.userId) },
          data: { phone: orderData.shippingDetails.phone }
        });

        // Create shipping address
        shippingAddress = await prisma.address.create({
          data: {
            userId: parseInt(orderData.userId),
            street: orderData.shippingDetails.street,
            city: orderData.shippingDetails.city,
            state: orderData.shippingDetails.state,
            zipCode: orderData.shippingDetails.postalCode,
            country: orderData.shippingDetails.country
          }
        });
      }
    } catch (error) {
      console.error('Error creating shipping address:', error);
    }

    // Create the order with items
    const order = await prisma.order.create({
      data: {
        userId: parseInt(orderData.userId),
        orderNumber: `ORD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        totalPrice: parseFloat(orderData.totalPrice),
        status: 'PENDING',
        paymentSlipUrl: paymentSlipUrl,
        shippingAddressId: shippingAddress?.id,
        items: {
          create: orderData.items.map(item => ({
            productId: parseInt(item.productId),
            quantity: parseInt(item.quantity),
            price: parseFloat(item.price)
          }))
        }
      },
      include: {
        items: true,
        shippingAddress: true
      }
    });

    res.status(201).json({
      message: 'Order created successfully',
      orderId: order.id,
      orderNumber: order.orderNumber
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

const generateReceipt = async (req, res) => {
  const { orderId } = req.params;

  try {
    // Create the receipts directory if it doesn't exist
    const receiptsDir = path.join(__dirname, '..', 'uploads', 'receipts');
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        user: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create PDF
    const doc = new PDFDocument();
    const filename = `receipt-${orderId}.pdf`;
    const filePath = path.join(receiptsDir, filename);

    doc.pipe(fs.createWriteStream(filePath));

    // Add content to PDF
    doc
      .fontSize(20)
      .text('Order Receipt', { align: 'center' })
      .moveDown();

    doc
      .fontSize(12)
      .text(`Order Number: ${order.orderNumber}`)
      .text(`Date: ${order.createdAt.toLocaleDateString()}`)
      .text(`Customer: ${order.user.firstName} ${order.user.lastName}`)
      .moveDown()
      .text('Order Items:')
      .moveDown();

    // Add order items
    order.items.forEach(item => {
      doc
        .text(`Product: ${item.product.name}`)
        .text(`Quantity: ${item.quantity}`)
        .text(`Price per item: LKR ${item.price.toLocaleString()}`)
        .text(`Subtotal: LKR ${(item.price * item.quantity).toLocaleString()}`)
        .moveDown();
    });

    // Add totals
    doc
      .moveDown()
      .text(`Subtotal: LKR ${order.subtotal.toLocaleString()}`)
      .text(`Shipping: LKR ${order.shippingCost?.toLocaleString() || '0'}`)
      .text(`Total: LKR ${order.totalPrice.toLocaleString()}`, { bold: true })
      .moveDown()
      .text('Thank you for your purchase!');

    // Finalize the PDF
    doc.end();

    // Wait for PDF to finish generating
    doc.on('end', () => {
      res.download(filePath, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          return res.status(500).json({ error: 'Failed to download receipt' });
        }
        // Clean up the file after sending
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting temporary receipt file:', unlinkErr);
        });
      });
    });
  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({ error: 'Failed to generate receipt' });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await prisma.order.findMany({
      where: { userId: parseInt(userId) },
      include: {
        items: {
          include: {
            product: {
              include: {
                productImages: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the orders with proper image URLs and totals
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber || `ORD-${order.id.toString().padStart(4, '0')}`,
      date: order.createdAt,
      status: order.status,
      totalPrice: parseFloat(order.totalPrice) || 0,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: parseFloat(item.price),
        product: {
          id: item.product.id,
          name: item.product.name,
          productImages: item.product.productImages.map(img => ({
            imageUrl: img.imageUrl.startsWith('/uploads') 
              ? `${process.env.BACKEND_URL}${img.imageUrl}`
              : img.imageUrl
          }))
        }
      }))
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        items: {
          include: {
            product: {
              include: {
                productImages: true
              }
            }
          }
        },
        shippingAddress: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the orders to match the frontend structure
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber || `ORD-${order.id.toString().padStart(4, '0')}`,
      customerName: `${order.user.firstName} ${order.user.lastName}`,
      email: order.user.email,
      date: order.createdAt,
      status: order.status.toLowerCase(),
      total: parseFloat(order.totalPrice) || 0,
      items: order.items.map(item => ({
        id: item.id,
        name: item.product.name,
        price: parseFloat(item.price) || 0,
        quantity: item.quantity,
        image: item.product.productImages[0]?.imageUrl || null
      })),
      shippingAddress: order.shippingAddress ? {
        street: order.shippingAddress.street,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.zipCode,
        country: order.shippingAddress.country
      } : null,
      paymentSlipUrl: order.paymentSlipUrl
    }));

    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders: ' + error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    const currentHistory = order.statusHistory ? JSON.parse(order.statusHistory) : ['PENDING'];
    const currentDates = order.statusDates ? JSON.parse(order.statusDates) : [order.createdAt];

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        status: status.toUpperCase(),
        statusHistory: JSON.stringify([...currentHistory, status.toUpperCase()]),
        statusDates: JSON.stringify([...currentDates, new Date().toISOString()])
      }
    });

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const order = await prisma.order.findUnique({
      where: { 
        id: parseInt(id) 
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profilePic: true
          }
        },
        items: {
          include: {
            product: {
              include: {
                productImages: true
              }
            }
          }
        },
        shippingAddress: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Format the order details with shipping address
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      date: order.createdAt,
      status: order.status.toLowerCase(),
      statusHistory: order.statusHistory ? JSON.parse(order.statusHistory) : ['PENDING'],
      statusDates: order.statusDates ? JSON.parse(order.statusDates) : [order.createdAt],
      total: order.totalPrice,
      subtotal: order.subtotal || order.totalPrice,
      shippingCost: order.shippingCost || 0,
      
      user: order.user,
      orderItems: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        product: {
          name: item.product.name,
          images: item.product.productImages?.map(img => img.imageUrl) || []
        }
      })),
      
      shippingAddress: order.shippingAddress ? {
        street: order.shippingAddress.street,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.zipCode,
        country: order.shippingAddress.country
      } : null,
      
      paymentDetails: {
        method: order.paymentMethod || "Bank Transfer",
        status: order.isPaid ? "paid" : "pending",
        paymentSlip: order.paymentSlipUrl ? {
          url: order.paymentSlipUrl
        } : null
      }
    };

    console.log('Sending formatted order:', formattedOrder);
    res.json(formattedOrder);
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ error: "Error fetching order details: " + error.message });
  }
};

module.exports = {
  createOrder,
  generateReceipt,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderDetails
}; 