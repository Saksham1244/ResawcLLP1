import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    let settings = await prisma.globalSettings.findUnique({
      where: { id: "default" }
    });

    if (!settings) {
      settings = await prisma.globalSettings.create({
        data: { id: "default", breakStartTime: "13:00", breakEndTime: "13:30" }
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      breakStartTime, 
      breakEndTime,
      activeDays,
      saturdayMode,
      workStartTime,
      workEndTime,
      breakDuration,
      lateGrace,
      latePenalty,
      // GST & Company
      gstNumber,
      panNumber,
      bankName,
      bankAccount,
      bankIfsc,
      bankBranch,
      upiId,
      companyAddress,
      gstLegalName,
      gstTradeName,
      gstState,
      gstStateCode,
      gstTaxpayerType,
      gstPortalUsername,
      gstPortalPassword,
      gspProvider,
      gstEnvironment,
      defaultSacCode,
      defaultGstRate,
      eInvoicingEnabled,
      eWayBillEnabled,
      eWayBillThreshold,
      reverseChargeApplicable,
      lutEnabled,
      lutNumber,
      invoicePrefix,
      authorizedSignatory,
      authorizedDesignation,
    } = data;

    const updateData: any = {};
    if (breakStartTime !== undefined) updateData.breakStartTime = breakStartTime;
    if (breakEndTime !== undefined) updateData.breakEndTime = breakEndTime;
    if (activeDays !== undefined) updateData.activeDays = activeDays;
    if (saturdayMode !== undefined) updateData.saturdayMode = saturdayMode;
    if (workStartTime !== undefined) updateData.workStartTime = workStartTime;
    if (workEndTime !== undefined) updateData.workEndTime = workEndTime;
    if (breakDuration !== undefined) updateData.breakDuration = breakDuration;
    if (lateGrace !== undefined) updateData.lateGrace = lateGrace;
    if (latePenalty !== undefined) updateData.latePenalty = latePenalty;

    // GST & Company updates
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber;
    if (panNumber !== undefined) updateData.panNumber = panNumber;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (bankAccount !== undefined) updateData.bankAccount = bankAccount;
    if (bankIfsc !== undefined) updateData.bankIfsc = bankIfsc;
    if (bankBranch !== undefined) updateData.bankBranch = bankBranch;
    if (upiId !== undefined) updateData.upiId = upiId;
    if (companyAddress !== undefined) updateData.companyAddress = companyAddress;
    if (gstLegalName !== undefined) updateData.gstLegalName = gstLegalName;
    if (gstTradeName !== undefined) updateData.gstTradeName = gstTradeName;
    if (gstState !== undefined) updateData.gstState = gstState;
    if (gstStateCode !== undefined) updateData.gstStateCode = gstStateCode;
    if (gstTaxpayerType !== undefined) updateData.gstTaxpayerType = gstTaxpayerType;
    if (gstPortalUsername !== undefined) updateData.gstPortalUsername = gstPortalUsername;
    if (gstPortalPassword !== undefined) updateData.gstPortalPassword = gstPortalPassword;
    if (gspProvider !== undefined) updateData.gspProvider = gspProvider;
    if (gstEnvironment !== undefined) updateData.gstEnvironment = gstEnvironment;
    if (defaultSacCode !== undefined) updateData.defaultSacCode = defaultSacCode;
    if (defaultGstRate !== undefined) updateData.defaultGstRate = Number(defaultGstRate);
    if (eInvoicingEnabled !== undefined) updateData.eInvoicingEnabled = Boolean(eInvoicingEnabled);
    if (eWayBillEnabled !== undefined) updateData.eWayBillEnabled = Boolean(eWayBillEnabled);
    if (eWayBillThreshold !== undefined) updateData.eWayBillThreshold = Number(eWayBillThreshold);
    if (reverseChargeApplicable !== undefined) updateData.reverseChargeApplicable = Boolean(reverseChargeApplicable);
    if (lutEnabled !== undefined) updateData.lutEnabled = Boolean(lutEnabled);
    if (lutNumber !== undefined) updateData.lutNumber = lutNumber;
    if (invoicePrefix !== undefined) updateData.invoicePrefix = invoicePrefix;
    if (authorizedSignatory !== undefined) updateData.authorizedSignatory = authorizedSignatory;
    if (authorizedDesignation !== undefined) updateData.authorizedDesignation = authorizedDesignation;

    const settings = await prisma.globalSettings.upsert({
      where: { id: "default" },
      update: updateData,
      create: { 
        id: "default", 
        breakStartTime: breakStartTime || "13:00", 
        breakEndTime: breakEndTime || "13:30",
        activeDays: activeDays || '["Mon","Tue","Wed","Thu","Fri"]',
        saturdayMode: saturdayMode || "All Saturdays",
        workStartTime: workStartTime || "09:00",
        workEndTime: workEndTime || "18:00",
        breakDuration: breakDuration || 30,
        lateGrace: lateGrace || 15,
        latePenalty: latePenalty || 3,
        gstNumber: gstNumber || "07AABCR1234F1Z5",
        panNumber: panNumber || "AABCR1234F",
        bankName: bankName || "HDFC Bank",
        bankAccount: bankAccount || "50200012345678",
        bankIfsc: bankIfsc || "HDFC0001234",
        companyAddress: companyAddress || "Resawc LLP, Creative Studio Hub, New Delhi, India",
        gstLegalName: gstLegalName || "Resawc LLP",
        gstTradeName: gstTradeName || "Resawc Creative Media",
        gstState: gstState || "Delhi",
        gstStateCode: gstStateCode || "07",
        gstTaxpayerType: gstTaxpayerType || "Regular",
        gstPortalUsername: gstPortalUsername || "RESAWC_GST",
        gspProvider: gspProvider || "NIC",
        gstEnvironment: gstEnvironment || "production",
        defaultSacCode: defaultSacCode || "998314",
        defaultGstRate: defaultGstRate ? Number(defaultGstRate) : 18.0,
      }
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
