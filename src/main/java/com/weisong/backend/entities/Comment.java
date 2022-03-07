package com.weisong.backend.entities;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Column;

/**
 * @author 李伟松
 * @create 2022-03-07-20:41
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("comment")
public class Comment{

    @Column(name="user_uuid")
    private String userUuid;

    @Column(name = "articleUuid")
    private String articleUuid;

    @Column(name="comment")
    private String comment;

    @Column(name="comment_time")
    private String commentTime;
}
