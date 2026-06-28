import { NextResponse } from "next/server";
import { getAllTags } from "@/lib/content";

export async function GET() {
  try {
    const tags = getAllTags();
    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Error fetching tags cloud:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}