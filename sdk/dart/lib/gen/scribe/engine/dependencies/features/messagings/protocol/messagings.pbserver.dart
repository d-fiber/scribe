// This is a generated file - do not edit.
//
// Generated from scribe/engine/dependencies/features/messagings/protocol/messagings.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import 'messagings.pb.dart' as $1;
import 'messagings.pbjson.dart';

export 'messagings.pb.dart';

abstract class MessagingsServiceBase extends $pb.GeneratedService {
  $async.Future<$1.MailResult> sendMail(
      $pb.ServerContext ctx, $1.MailRequest request);
  $async.Future<$1.SmsResult> sendSms(
      $pb.ServerContext ctx, $1.SmsRequest request);
  $async.Future<$1.PushResult> sendPush(
      $pb.ServerContext ctx, $1.PushRequest request);

  $pb.GeneratedMessage createRequest($core.String methodName) {
    switch (methodName) {
      case 'SendMail':
        return $1.MailRequest();
      case 'SendSms':
        return $1.SmsRequest();
      case 'SendPush':
        return $1.PushRequest();
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $async.Future<$pb.GeneratedMessage> handleCall($pb.ServerContext ctx,
      $core.String methodName, $pb.GeneratedMessage request) {
    switch (methodName) {
      case 'SendMail':
        return sendMail(ctx, request as $1.MailRequest);
      case 'SendSms':
        return sendSms(ctx, request as $1.SmsRequest);
      case 'SendPush':
        return sendPush(ctx, request as $1.PushRequest);
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $core.Map<$core.String, $core.dynamic> get $json =>
      MessagingsServiceBase$json;
  $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
      get $messageJson => MessagingsServiceBase$messageJson;
}
