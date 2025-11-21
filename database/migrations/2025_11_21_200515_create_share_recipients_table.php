<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('share_recipients', function (Blueprint $table) {
            $table->id();
            $table->integer('template_id');
            $table->integer('user_id');
            $table->integer('recipient_id');
            $table->longText('field_json')->nullable();
            $table->date('date')->nullable();
            $table->text('token')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('share_recipients');
    }
};
