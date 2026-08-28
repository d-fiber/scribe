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

import '../../../../../protocol/common.pb.dart' as $0;

export 'package:protobuf/protobuf.dart' show GeneratedMessageGenericExtensions;

class Recipient extends $pb.GeneratedMessage {
  factory Recipient({
    $core.String? address,
    $core.String? name,
  }) {
    final result = create();
    if (address != null) result.address = address;
    if (name != null) result.name = name;
    return result;
  }

  Recipient._();

  factory Recipient.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Recipient.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Recipient',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.messagings.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'address')
    ..aOS(2, _omitFieldNames ? '' : 'name')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Recipient clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Recipient copyWith(void Function(Recipient) updates) =>
      super.copyWith((message) => updates(message as Recipient)) as Recipient;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Recipient create() => Recipient._();
  @$core.override
  Recipient createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Recipient getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Recipient>(create);
  static Recipient? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get address => $_getSZ(0);
  @$pb.TagNumber(1)
  set address($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasAddress() => $_has(0);
  @$pb.TagNumber(1)
  void clearAddress() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get name => $_getSZ(1);
  @$pb.TagNumber(2)
  set name($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasName() => $_has(1);
  @$pb.TagNumber(2)
  void clearName() => $_clearField(2);
}

class MailRequest extends $pb.GeneratedMessage {
  factory MailRequest({
    $core.String? account,
    $core.Iterable<Recipient>? to,
    $core.Iterable<Recipient>? cc,
    $core.Iterable<Recipient>? bcc,
    $core.String? subject,
    $core.String? template,
    $0.Json? templateData,
    $core.String? html,
    $core.String? text,
  }) {
    final result = create();
    if (account != null) result.account = account;
    if (to != null) result.to.addAll(to);
    if (cc != null) result.cc.addAll(cc);
    if (bcc != null) result.bcc.addAll(bcc);
    if (subject != null) result.subject = subject;
    if (template != null) result.template = template;
    if (templateData != null) result.templateData = templateData;
    if (html != null) result.html = html;
    if (text != null) result.text = text;
    return result;
  }

  MailRequest._();

  factory MailRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory MailRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'MailRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.messagings.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'account')
    ..pPM<Recipient>(2, _omitFieldNames ? '' : 'to',
        subBuilder: Recipient.create)
    ..pPM<Recipient>(3, _omitFieldNames ? '' : 'cc',
        subBuilder: Recipient.create)
    ..pPM<Recipient>(4, _omitFieldNames ? '' : 'bcc',
        subBuilder: Recipient.create)
    ..aOS(5, _omitFieldNames ? '' : 'subject')
    ..aOS(6, _omitFieldNames ? '' : 'template')
    ..aOM<$0.Json>(7, _omitFieldNames ? '' : 'templateData',
        subBuilder: $0.Json.create)
    ..aOS(8, _omitFieldNames ? '' : 'html')
    ..aOS(9, _omitFieldNames ? '' : 'text')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  MailRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  MailRequest copyWith(void Function(MailRequest) updates) =>
      super.copyWith((message) => updates(message as MailRequest))
          as MailRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static MailRequest create() => MailRequest._();
  @$core.override
  MailRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static MailRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<MailRequest>(create);
  static MailRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get account => $_getSZ(0);
  @$pb.TagNumber(1)
  set account($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasAccount() => $_has(0);
  @$pb.TagNumber(1)
  void clearAccount() => $_clearField(1);

  @$pb.TagNumber(2)
  $pb.PbList<Recipient> get to => $_getList(1);

  @$pb.TagNumber(3)
  $pb.PbList<Recipient> get cc => $_getList(2);

  @$pb.TagNumber(4)
  $pb.PbList<Recipient> get bcc => $_getList(3);

  @$pb.TagNumber(5)
  $core.String get subject => $_getSZ(4);
  @$pb.TagNumber(5)
  set subject($core.String value) => $_setString(4, value);
  @$pb.TagNumber(5)
  $core.bool hasSubject() => $_has(4);
  @$pb.TagNumber(5)
  void clearSubject() => $_clearField(5);

  @$pb.TagNumber(6)
  $core.String get template => $_getSZ(5);
  @$pb.TagNumber(6)
  set template($core.String value) => $_setString(5, value);
  @$pb.TagNumber(6)
  $core.bool hasTemplate() => $_has(5);
  @$pb.TagNumber(6)
  void clearTemplate() => $_clearField(6);

  @$pb.TagNumber(7)
  $0.Json get templateData => $_getN(6);
  @$pb.TagNumber(7)
  set templateData($0.Json value) => $_setField(7, value);
  @$pb.TagNumber(7)
  $core.bool hasTemplateData() => $_has(6);
  @$pb.TagNumber(7)
  void clearTemplateData() => $_clearField(7);
  @$pb.TagNumber(7)
  $0.Json ensureTemplateData() => $_ensure(6);

  @$pb.TagNumber(8)
  $core.String get html => $_getSZ(7);
  @$pb.TagNumber(8)
  set html($core.String value) => $_setString(7, value);
  @$pb.TagNumber(8)
  $core.bool hasHtml() => $_has(7);
  @$pb.TagNumber(8)
  void clearHtml() => $_clearField(8);

  @$pb.TagNumber(9)
  $core.String get text => $_getSZ(8);
  @$pb.TagNumber(9)
  set text($core.String value) => $_setString(8, value);
  @$pb.TagNumber(9)
  $core.bool hasText() => $_has(8);
  @$pb.TagNumber(9)
  void clearText() => $_clearField(9);
}

class MailResult extends $pb.GeneratedMessage {
  factory MailResult({
    $core.String? messageId,
    $0.Failure? error,
  }) {
    final result = create();
    if (messageId != null) result.messageId = messageId;
    if (error != null) result.error = error;
    return result;
  }

  MailResult._();

  factory MailResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory MailResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'MailResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.messagings.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'messageId')
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  MailResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  MailResult copyWith(void Function(MailResult) updates) =>
      super.copyWith((message) => updates(message as MailResult)) as MailResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static MailResult create() => MailResult._();
  @$core.override
  MailResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static MailResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<MailResult>(create);
  static MailResult? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get messageId => $_getSZ(0);
  @$pb.TagNumber(1)
  set messageId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasMessageId() => $_has(0);
  @$pb.TagNumber(1)
  void clearMessageId() => $_clearField(1);

  @$pb.TagNumber(2)
  $0.Failure get error => $_getN(1);
  @$pb.TagNumber(2)
  set error($0.Failure value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasError() => $_has(1);
  @$pb.TagNumber(2)
  void clearError() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Failure ensureError() => $_ensure(1);
}

class SmsRequest extends $pb.GeneratedMessage {
  factory SmsRequest({
    $core.String? to,
    $core.String? template,
    $0.Json? templateData,
    $core.String? body,
  }) {
    final result = create();
    if (to != null) result.to = to;
    if (template != null) result.template = template;
    if (templateData != null) result.templateData = templateData;
    if (body != null) result.body = body;
    return result;
  }

  SmsRequest._();

  factory SmsRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory SmsRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'SmsRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.messagings.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'to')
    ..aOS(2, _omitFieldNames ? '' : 'template')
    ..aOM<$0.Json>(3, _omitFieldNames ? '' : 'templateData',
        subBuilder: $0.Json.create)
    ..aOS(4, _omitFieldNames ? '' : 'body')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SmsRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SmsRequest copyWith(void Function(SmsRequest) updates) =>
      super.copyWith((message) => updates(message as SmsRequest)) as SmsRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static SmsRequest create() => SmsRequest._();
  @$core.override
  SmsRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static SmsRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<SmsRequest>(create);
  static SmsRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get to => $_getSZ(0);
  @$pb.TagNumber(1)
  set to($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasTo() => $_has(0);
  @$pb.TagNumber(1)
  void clearTo() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get template => $_getSZ(1);
  @$pb.TagNumber(2)
  set template($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasTemplate() => $_has(1);
  @$pb.TagNumber(2)
  void clearTemplate() => $_clearField(2);

  @$pb.TagNumber(3)
  $0.Json get templateData => $_getN(2);
  @$pb.TagNumber(3)
  set templateData($0.Json value) => $_setField(3, value);
  @$pb.TagNumber(3)
  $core.bool hasTemplateData() => $_has(2);
  @$pb.TagNumber(3)
  void clearTemplateData() => $_clearField(3);
  @$pb.TagNumber(3)
  $0.Json ensureTemplateData() => $_ensure(2);

  @$pb.TagNumber(4)
  $core.String get body => $_getSZ(3);
  @$pb.TagNumber(4)
  set body($core.String value) => $_setString(3, value);
  @$pb.TagNumber(4)
  $core.bool hasBody() => $_has(3);
  @$pb.TagNumber(4)
  void clearBody() => $_clearField(4);
}

class SmsResult extends $pb.GeneratedMessage {
  factory SmsResult({
    $core.String? messageId,
    $0.Failure? error,
  }) {
    final result = create();
    if (messageId != null) result.messageId = messageId;
    if (error != null) result.error = error;
    return result;
  }

  SmsResult._();

  factory SmsResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory SmsResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'SmsResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.messagings.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'messageId')
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SmsResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SmsResult copyWith(void Function(SmsResult) updates) =>
      super.copyWith((message) => updates(message as SmsResult)) as SmsResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static SmsResult create() => SmsResult._();
  @$core.override
  SmsResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static SmsResult getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<SmsResult>(create);
  static SmsResult? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get messageId => $_getSZ(0);
  @$pb.TagNumber(1)
  set messageId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasMessageId() => $_has(0);
  @$pb.TagNumber(1)
  void clearMessageId() => $_clearField(1);

  @$pb.TagNumber(2)
  $0.Failure get error => $_getN(1);
  @$pb.TagNumber(2)
  set error($0.Failure value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasError() => $_has(1);
  @$pb.TagNumber(2)
  void clearError() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Failure ensureError() => $_ensure(1);
}

class PushRequest extends $pb.GeneratedMessage {
  factory PushRequest({
    $core.Iterable<$core.String>? tokens,
    $core.Iterable<$core.String>? userIds,
    $core.String? template,
    $0.Json? templateData,
    $core.String? title,
    $core.String? body,
    $0.Json? data,
  }) {
    final result = create();
    if (tokens != null) result.tokens.addAll(tokens);
    if (userIds != null) result.userIds.addAll(userIds);
    if (template != null) result.template = template;
    if (templateData != null) result.templateData = templateData;
    if (title != null) result.title = title;
    if (body != null) result.body = body;
    if (data != null) result.data = data;
    return result;
  }

  PushRequest._();

  factory PushRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory PushRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'PushRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.messagings.v1'),
      createEmptyInstance: create)
    ..pPS(1, _omitFieldNames ? '' : 'tokens')
    ..pPS(2, _omitFieldNames ? '' : 'userIds')
    ..aOS(3, _omitFieldNames ? '' : 'template')
    ..aOM<$0.Json>(4, _omitFieldNames ? '' : 'templateData',
        subBuilder: $0.Json.create)
    ..aOS(5, _omitFieldNames ? '' : 'title')
    ..aOS(6, _omitFieldNames ? '' : 'body')
    ..aOM<$0.Json>(7, _omitFieldNames ? '' : 'data', subBuilder: $0.Json.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  PushRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  PushRequest copyWith(void Function(PushRequest) updates) =>
      super.copyWith((message) => updates(message as PushRequest))
          as PushRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static PushRequest create() => PushRequest._();
  @$core.override
  PushRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static PushRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<PushRequest>(create);
  static PushRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $pb.PbList<$core.String> get tokens => $_getList(0);

  @$pb.TagNumber(2)
  $pb.PbList<$core.String> get userIds => $_getList(1);

  @$pb.TagNumber(3)
  $core.String get template => $_getSZ(2);
  @$pb.TagNumber(3)
  set template($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasTemplate() => $_has(2);
  @$pb.TagNumber(3)
  void clearTemplate() => $_clearField(3);

  @$pb.TagNumber(4)
  $0.Json get templateData => $_getN(3);
  @$pb.TagNumber(4)
  set templateData($0.Json value) => $_setField(4, value);
  @$pb.TagNumber(4)
  $core.bool hasTemplateData() => $_has(3);
  @$pb.TagNumber(4)
  void clearTemplateData() => $_clearField(4);
  @$pb.TagNumber(4)
  $0.Json ensureTemplateData() => $_ensure(3);

  @$pb.TagNumber(5)
  $core.String get title => $_getSZ(4);
  @$pb.TagNumber(5)
  set title($core.String value) => $_setString(4, value);
  @$pb.TagNumber(5)
  $core.bool hasTitle() => $_has(4);
  @$pb.TagNumber(5)
  void clearTitle() => $_clearField(5);

  @$pb.TagNumber(6)
  $core.String get body => $_getSZ(5);
  @$pb.TagNumber(6)
  set body($core.String value) => $_setString(5, value);
  @$pb.TagNumber(6)
  $core.bool hasBody() => $_has(5);
  @$pb.TagNumber(6)
  void clearBody() => $_clearField(6);

  @$pb.TagNumber(7)
  $0.Json get data => $_getN(6);
  @$pb.TagNumber(7)
  set data($0.Json value) => $_setField(7, value);
  @$pb.TagNumber(7)
  $core.bool hasData() => $_has(6);
  @$pb.TagNumber(7)
  void clearData() => $_clearField(7);
  @$pb.TagNumber(7)
  $0.Json ensureData() => $_ensure(6);
}

class PushResult extends $pb.GeneratedMessage {
  factory PushResult({
    $core.int? sent,
    $core.int? failed,
    $0.Failure? error,
  }) {
    final result = create();
    if (sent != null) result.sent = sent;
    if (failed != null) result.failed = failed;
    if (error != null) result.error = error;
    return result;
  }

  PushResult._();

  factory PushResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory PushResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'PushResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.messagings.v1'),
      createEmptyInstance: create)
    ..aI(1, _omitFieldNames ? '' : 'sent', fieldType: $pb.PbFieldType.OU3)
    ..aI(2, _omitFieldNames ? '' : 'failed', fieldType: $pb.PbFieldType.OU3)
    ..aOM<$0.Failure>(3, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  PushResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  PushResult copyWith(void Function(PushResult) updates) =>
      super.copyWith((message) => updates(message as PushResult)) as PushResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static PushResult create() => PushResult._();
  @$core.override
  PushResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static PushResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<PushResult>(create);
  static PushResult? _defaultInstance;

  @$pb.TagNumber(1)
  $core.int get sent => $_getIZ(0);
  @$pb.TagNumber(1)
  set sent($core.int value) => $_setUnsignedInt32(0, value);
  @$pb.TagNumber(1)
  $core.bool hasSent() => $_has(0);
  @$pb.TagNumber(1)
  void clearSent() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.int get failed => $_getIZ(1);
  @$pb.TagNumber(2)
  set failed($core.int value) => $_setUnsignedInt32(1, value);
  @$pb.TagNumber(2)
  $core.bool hasFailed() => $_has(1);
  @$pb.TagNumber(2)
  void clearFailed() => $_clearField(2);

  @$pb.TagNumber(3)
  $0.Failure get error => $_getN(2);
  @$pb.TagNumber(3)
  set error($0.Failure value) => $_setField(3, value);
  @$pb.TagNumber(3)
  $core.bool hasError() => $_has(2);
  @$pb.TagNumber(3)
  void clearError() => $_clearField(3);
  @$pb.TagNumber(3)
  $0.Failure ensureError() => $_ensure(2);
}

class MessagingsApi {
  final $pb.RpcClient _client;

  MessagingsApi(this._client);

  $async.Future<MailResult> sendMail(
          $pb.ClientContext? ctx, MailRequest request) =>
      _client.invoke<MailResult>(
          ctx, 'Messagings', 'SendMail', request, MailResult());
  $async.Future<SmsResult> sendSms(
          $pb.ClientContext? ctx, SmsRequest request) =>
      _client.invoke<SmsResult>(
          ctx, 'Messagings', 'SendSms', request, SmsResult());
  $async.Future<PushResult> sendPush(
          $pb.ClientContext? ctx, PushRequest request) =>
      _client.invoke<PushResult>(
          ctx, 'Messagings', 'SendPush', request, PushResult());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
