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
        Schema::table('share_recipients', function (Blueprint $table) {
            $table->integer('status')->default(0)->after('user_id')->comment('0 = Send 1 = View 2 = Completed 3 = Cancel');
            $table->dateTime('send_date_time')->after('status')->nullable();
            $table->dateTime('view_date_time')->after('send_date_time')->nullable();
            $table->dateTime('completed_date_time')->after('view_date_time')->nullable();
            $table->string('ip_address')->after('completed_date_time')->nullable();
            $table->string('location')->after('ip_address')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('share_recipients', function (Blueprint $table) {
            $table->dropColumn(['status', 'send_date_time', 'view_date_time', 'completed_date_time', 'ip_address', 'location']);
        });
    }
};
